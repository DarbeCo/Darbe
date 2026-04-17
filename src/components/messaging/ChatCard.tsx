import { DefaultTime } from "../../utils/CommonDateFormats";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { getImageMessageSrc, isImageMessage } from "./messageUtils";

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
  const formattedDate = DefaultTime(new Date(dateSent));
  const myMessageClass = isMyMessage ? styles.myMessage : styles.friendMessage;
  const chatMessageFormatting = isMyMessage
    ? styles.myMessageChatFormat
    : styles.friendMessageChatFormat;
  const isPhotoMessage = isImageMessage(message);

  return (
    <div className={myMessageClass}>
      <UserAvatars userId={userId} profilePicture={profilePicture} />
      <div className={chatMessageFormatting}>
        <div className={styles.chatContent}>
          {isPhotoMessage ? (
            <img
              src={getImageMessageSrc(message)}
              alt="Message attachment"
              className={styles.chatMessageImage}
            />
          ) : (
            <Typography
              variant="text"
              textToDisplay={message}
              extraClass="ChatCardText"
            />
          )}
        </div>
        <Typography variant="grayText" textToDisplay={formattedDate} />
      </div>
    </div>
  );
};
