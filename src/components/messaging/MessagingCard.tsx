import { useNavigate } from "react-router-dom";

import { MessageState } from "../../services/api/endpoints/types/messages.api.types";
import { Typography } from "../typography/Typography";
import { FRIEND_MESSAGE_ROUTE } from "../../routes/route.constants";
import { UserAvatars } from "../avatars/UserAvatars";
import { DefaultTime } from "../../utils/CommonDateFormats";
import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";
import { VerticalMore } from "../verticalMore/VerticalMore";
import { getMessagePreviewText } from "./messageUtils";

import styles from "./styles/messaging.module.css";
import { ITEM_CATEGORIES } from "../miniMenu/constants";

interface MessagingCardProps {
  currentUserId: string | undefined;
  participants: SimpleUserInfo[];
  messages: MessageState[];
  messageThreadId: string;
  // TODO: Rework this in backend, comes back as null intermittently
  lastMessage?: MessageState | null;
}

export const MessagingCard = ({
  currentUserId,
  participants,
  messageThreadId,
  messages,
}: MessagingCardProps) => {
  const navigate = useNavigate();

  const handleClick = (participantId: string | undefined) => {
    if (participantId) {
      console.log("Navigating to message with:", participantId);
      navigate(FRIEND_MESSAGE_ROUTE(participantId));
    }
  };

  // Safely get the last message — messages may be empty
  const lastMessage =
    messages && messages.length > 0 ? messages[messages.length - 1] : undefined;

  const displayedUser = participants.find(
    (participant) => participant.id !== currentUserId
  );

  const receiverFullName = displayedUser?.fullName ?? "";
  const formattedDate = lastMessage?.dateSent
    ? DefaultTime(new Date(lastMessage.dateSent))
    : "";

  return (
    <div className={styles.messagingCard}>
      <UserAvatars
        userId={displayedUser?.id}
        profilePicture={displayedUser?.profilePicture}
        variant="small"
      />
      <div className={styles.messagePreview}>
        <div className={styles.messagePreviewHeader}>
          <Typography variant="text" textToDisplay={receiverFullName} />
          <div className={styles.messagePreviewDate}>
            <Typography textToDisplay={formattedDate} variant="grayText" />
            <VerticalMore
              itemCategory={ITEM_CATEGORIES.MESSAGES}
              itemId={messageThreadId}
              canEdit
            />
          </div>
        </div>
        <div
          className={styles.messagePreview}
          onClick={() => handleClick(displayedUser?.id)}
        >
          <Typography
            variant="text"
            textToDisplay={
              lastMessage ? getMessagePreviewText(lastMessage.message) : "No messages yet"
            }
            extraClass="paddingLeft"
          />
        </div>
      </div>
    </div>
  );
};
