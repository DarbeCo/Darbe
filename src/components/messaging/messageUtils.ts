const MESSAGE_IMAGE_PREFIX = "__darbe_image__:";

export const createImageMessagePayload = (base64Image: string) =>
  `${MESSAGE_IMAGE_PREFIX}${base64Image}`;

export const isImageMessage = (message: string) =>
  message.startsWith(MESSAGE_IMAGE_PREFIX);

export const getImageMessageSrc = (message: string) =>
  message.slice(MESSAGE_IMAGE_PREFIX.length);

export const getMessagePreviewText = (message: string) =>
  isImageMessage(message) ? "Photo" : message;
