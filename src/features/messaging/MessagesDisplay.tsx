import { CircularProgress } from "@mui/material";

import { useGetMessageThreadQuery } from "../../services/api/endpoints/messages/messages.api";
import { MessagingInput } from "../../components/messaging/MessagingInput";
import { ChatCard } from "../../components/messaging/ChatCard";

import styles from "./styles/messaging.module.css";

interface MessagesDisplayProps {
  currentUserId?: string;
  friendId?: string;
}

export const MessagesDisplay = ({
  currentUserId,
  friendId,
}: MessagesDisplayProps) => {
  if (!currentUserId || !friendId) {
    return null;
  }

  const { data: messageThread, isLoading } = useGetMessageThreadQuery(
    {
      friendId,
    },
    {
      pollingInterval: 2500,
      skipPollingIfUnfocused: true,
    }
  );

  if (!messageThread) {
    return null;
  }

  const { messages, participants } = messageThread;

  return (
    <>
      <div className={styles.messageThread}>
        {isLoading && <CircularProgress />}
        {messages?.map((message, idx) => {
          const userToDisplay = participants.find(
            (participant) => participant.id !== message.receiverId
          );
          const isMyMessage = message.senderId === currentUserId;

          return (
            <ChatCard
              key={idx}
              isMyMessage={isMyMessage}
              userId={userToDisplay?.id}
              message={message.message}
              dateSent={message.dateSent}
              profilePicture={userToDisplay?.profilePicture}
            />
          );
        })}
      </div>
      <MessagingInput currentUserId={currentUserId} receiverId={friendId} />
    </>
  );
};
