import { MessageTime } from "../../utils/CommonDateFormats";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import {
  getImageMessageSrc,
  getMessageText,
  isImageMessage,
} from "./messageUtils";

import styles from "./styles/messaging.module.css";

interface ChatCardProps {
  userId: string | undefined;
  message: string;
  dateSent: string;
  isMyMessage: boolean;
  profilePicture?: string;
}

export const ChatCard = ({
  userId,
  message,
  profilePicture,
  isMyMessage,
  dateSent,
}: ChatCardProps) => {
  const formattedDate = MessageTime(new Date(dateSent));
  const myMessageClass = isMyMessage ? styles.myMessage : styles.friendMessage;
  const chatMessageFormatting = isMyMessage
    ? styles.myMessageChatFormat
    : styles.friendMessageChatFormat;
  const isPhotoMessage = isImageMessage(message);
  const messageText = getMessageText(message);
  const imageSrc = getImageMessageSrc(message);

  return (
    <div className={myMessageClass}>
      {!isMyMessage && (
        <UserAvatars userId={userId} profilePicture={profilePicture} />
      )}
      <div className={chatMessageFormatting}>
        <div className={styles.chatContent}>
          {messageText && (
            <Typography
              variant="text"
              textToDisplay={messageText}
              extraClass="ChatCardText"
            />
          )}
          {isPhotoMessage && imageSrc && (
            <img
              src={imageSrc}
              alt="Message attachment"
              className={styles.chatMessageImage}
            />
          )}
        </div>
        <Typography variant="grayText" textToDisplay={formattedDate} />
      </div>
    </div>
  );
};
