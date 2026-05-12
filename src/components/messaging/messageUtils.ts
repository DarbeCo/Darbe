const MESSAGE_IMAGE_PREFIX = "__darbe_image__:";
const MESSAGE_WITH_IMAGE_PREFIX = "__darbe_message_with_image__:";
const DATA_IMAGE_PREFIX = "data:image/";

type MessageWithImage = {
  text: string;
  imageSrc: string;
};

type MessageLike = {
  senderId: string;
  receiverId: string;
  message: string;
  dateSent: string;
};

const parseMessageWithImage = (message: string): MessageWithImage | null => {
  if (!message.startsWith(MESSAGE_WITH_IMAGE_PREFIX)) {
    return null;
  }

  try {
    const parsedMessage = JSON.parse(
      message.slice(MESSAGE_WITH_IMAGE_PREFIX.length)
    );

    return {
      text:
        typeof parsedMessage.text === "string" ? parsedMessage.text : "",
      imageSrc:
        typeof parsedMessage.imageSrc === "string"
          ? parsedMessage.imageSrc
          : "",
    };
  } catch {
    return null;
  }
};

export const createImageMessagePayload = (base64Image: string, text = "") => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return `${MESSAGE_IMAGE_PREFIX}${base64Image}`;
  }

  return `${MESSAGE_WITH_IMAGE_PREFIX}${JSON.stringify({
    text: trimmedText,
    imageSrc: base64Image,
  })}`;
};

export const isImageMessage = (message: string) =>
  message.startsWith(MESSAGE_IMAGE_PREFIX) ||
  message.startsWith(DATA_IMAGE_PREFIX) ||
  Boolean(parseMessageWithImage(message)?.imageSrc);

export const getImageMessageSrc = (message: string) => {
  const combinedMessage = parseMessageWithImage(message);

  if (combinedMessage) {
    return combinedMessage.imageSrc;
  }

  if (message.startsWith(MESSAGE_IMAGE_PREFIX)) {
    return message.slice(MESSAGE_IMAGE_PREFIX.length);
  }

  return message.startsWith(DATA_IMAGE_PREFIX) ? message : "";
};

export const getMessageText = (message: string) =>
  parseMessageWithImage(message)?.text ?? (isImageMessage(message) ? "" : message);

export const getMessagePreviewText = (message: string) =>
  isImageMessage(message)
    ? getMessageText(message)
      ? `Photo: ${getMessageText(message)}`
      : "Photo"
    : message;

const areMessagesCloseTogether = (firstDate: string, secondDate: string) => {
  const firstTime = new Date(firstDate).getTime();
  const secondTime = new Date(secondDate).getTime();

  if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
    return false;
  }

  return Math.abs(secondTime - firstTime) <= 120000;
};

export const combineImageAndTextMessages = <TMessage extends MessageLike>(
  messages: TMessage[]
): TMessage[] => {
  const combinedMessages: TMessage[] = [];
  const consumedIndexes = new Set<number>();

  messages.forEach((message, index) => {
    if (consumedIndexes.has(index)) {
      return;
    }

    const messageIsImage = isImageMessage(message.message);
    const matchingIndex = messages.findIndex((candidate, candidateIndex) => {
      if (candidateIndex <= index || consumedIndexes.has(candidateIndex)) {
        return false;
      }

      return (
        messageIsImage !== isImageMessage(candidate.message) &&
        message.senderId === candidate.senderId &&
        message.receiverId === candidate.receiverId &&
        areMessagesCloseTogether(message.dateSent, candidate.dateSent)
      );
    });

    if (matchingIndex === -1) {
      combinedMessages.push(message);
      return;
    }

    const matchingMessage = messages[matchingIndex];
    const imageMessage = messageIsImage ? message : matchingMessage;
    const textMessage = messageIsImage ? matchingMessage : message;

    consumedIndexes.add(matchingIndex);
    combinedMessages.push({
      ...imageMessage,
      dateSent:
        new Date(imageMessage.dateSent).getTime() >=
        new Date(textMessage.dateSent).getTime()
          ? imageMessage.dateSent
          : textMessage.dateSent,
      message: createImageMessagePayload(
        getImageMessageSrc(imageMessage.message),
        getMessageText(textMessage.message)
      ),
    });
  });

  return combinedMessages;
};
