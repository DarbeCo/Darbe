import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CircularProgress, IconButton } from "@mui/material";

import { ClosingIcon } from "../../components/closingIcon/ClosingIcon";
import { Typography } from "../../components/typography/Typography";
import { useGetMessagesQuery } from "../../services/api/endpoints/messages/messages.api";
import { MessagingCard } from "../../components/messaging/MessagingCard";
import { CustomSvgs } from "../../components/customSvgs/CustomSvgs";
import { NEW_MESSAGE_ROUTE } from "../../routes/route.constants";
import { selectCurrentUserId } from "../users/selectors";

import styles from "./styles/messaging.module.css";

export const Messaging = () => {
  const navigate = useNavigate();
  const userId = useSelector(selectCurrentUserId);
  const { data: messageThreads, isLoading } = useGetMessagesQuery();

  const handleCreateNewMessage = () => {
    if (!userId) return;

    navigate(NEW_MESSAGE_ROUTE(userId));
  };

  return (
    <div className={styles.messagingPage}>
      <div className={styles.messagingHeader}>
        <div className={styles.createMessageHeader}>
          <Typography
            variant="sectionTitle"
            textToDisplay="Messages"
            extraClass="paddingLeft"
          />
          <IconButton onClick={handleCreateNewMessage}>
            <CustomSvgs
              svgPath="/svgs/common/createMessageIcon.svg"
              variant="small"
              altText="Create message"
            />
          </IconButton>
        </div>
        <ClosingIcon useNoSx />
      </div>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <div className={styles.messagePreview}>
          {messageThreads && messageThreads?.length > 0 ? (
            messageThreads?.map((messageThread) => (
              <MessagingCard
                key={messageThread.id}
                currentUserId={userId}
                messageThreadId={messageThread.id}
                participants={messageThread.participants}
                messages={messageThread.messages}
              />
            ))
          ) : (
            <Typography textToDisplay="No messages" variant="header" />
          )}
        </div>
      )}
    </div>
  );
};
