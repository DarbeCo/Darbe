import { useState } from "react";

import { Inputs } from "../inputs/Inputs";
import { DarbeButton } from "../buttons/DarbeButton";
import { useCreateMessageMutation } from "../../services/api/endpoints/messages/messages.api";

import styles from "./styles/messaging.module.css";

interface MessagingInputProps {
  currentUserId: string;
  receiverId: string;
  initialMessage?: string;
}

// TODO: Pop up modal on error?
export const MessagingInput = ({
  currentUserId,
  receiverId,
  initialMessage = "",
}: MessagingInputProps) => {
  const [message, setMessage] = useState(initialMessage);
  const [showShareConfirmation, setShowShareConfirmation] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const [sendMessage] = useCreateMessageMutation();

  const handleClick = async () => {
    try {
      const newMessage = {
        senderId: currentUserId,
        receiverId,
        message,
      };
      setMessage("");
      await sendMessage(newMessage).unwrap();
      if (initialMessage) {
        setShowShareConfirmation(true);
        setTimeout(() => setShowShareConfirmation(false), 1400);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.messagingInput}>
      <Inputs
        darbeInputType="standardInput"
        name="messageText"
        label=""
        value={message}
        placeholder="Type a message..."
        handleChange={handleChange}
      />
      <DarbeButton
        buttonText="Send"
        darbeButtonType="postActionButton"
        onClick={handleClick}
      />
      {showShareConfirmation && (
        <div className={styles.shareConfirmationDialog} role="status">
          <span className={styles.shareConfirmationIcon} aria-hidden="true" />
          <span>Event shared</span>
        </div>
      )}
    </div>
  );
};
