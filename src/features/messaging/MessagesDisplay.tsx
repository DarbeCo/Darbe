import { useEffect, useMemo, useRef } from "react";
import { CircularProgress } from "@mui/material";

import { useGetMessageThreadQuery } from "../../services/api/endpoints/messages/messages.api";
import { MessagingInput } from "../../components/messaging/MessagingInput";
import { ChatCard } from "../../components/messaging/ChatCard";
import { combineImageAndTextMessages } from "../../components/messaging/messageUtils";

import styles from "./styles/messaging.module.css";

interface MessagesDisplayProps {
  currentUserId?: string;
  friendId?: string;
  initialMessage?: string;
}

export const MessagesDisplay = ({
  currentUserId,
  friendId,
  initialMessage,
}: MessagesDisplayProps) => {
  const { data: messageThread, isLoading } = useGetMessageThreadQuery(
    {
      friendId: friendId || "",
    },
    {
      pollingInterval: 2500,
      skip: !currentUserId || !friendId,
      skipPollingIfUnfocused: true,
    }
  );

  const messageThreadRef = useRef<HTMLDivElement>(null);
  const messageThreadEndRef = useRef<HTMLDivElement>(null);
  const displayedMessages = useMemo(
    () => combineImageAndTextMessages(messageThread?.messages ?? []),
    [messageThread?.messages]
  );

  const scrollMessagesToBottom = () => {
    messageThreadEndRef.current?.scrollIntoView({ block: "end" });

    const messageThreadElement = messageThreadRef.current;
    if (messageThreadElement) {
      messageThreadElement.scrollTop = messageThreadElement.scrollHeight;
    }
  };

  useEffect(() => {
    requestAnimationFrame(scrollMessagesToBottom);
    const scrollTimeout = window.setTimeout(scrollMessagesToBottom, 100);

    return () => window.clearTimeout(scrollTimeout);
  }, [displayedMessages.length, friendId]);

  if (!currentUserId || !friendId || !messageThread) {
    return null;
  }

  const { participants } = messageThread;

  return (
    <>
      <div className={styles.messageThread} ref={messageThreadRef}>
        {isLoading && <CircularProgress />}
        {displayedMessages.map((message, idx) => {
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
        <div ref={messageThreadEndRef} />
      </div>
      <MessagingInput
        currentUserId={currentUserId}
        receiverId={friendId}
        initialMessage={initialMessage}
      />
    </>
  );
};
