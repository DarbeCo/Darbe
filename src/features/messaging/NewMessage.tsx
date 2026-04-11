import { useNavigate } from "react-router-dom";

import { FriendListDisplay } from "../../components/friends/FriendListDisplay";
import { SimpleHeader } from "../../components/simpleHeader/SimpleHeader";
import { FRIEND_MESSAGE_ROUTE } from "../../routes/route.constants";

import styles from "./styles/messaging.module.css";

export const NewMessage = () => {
  const navigate = useNavigate();

  const handleClick = (friendId: string) => {
    navigate(FRIEND_MESSAGE_ROUTE(friendId));
  };

  return (
    <div className={styles.newMessage}>
      <SimpleHeader textVariant="header" headerText="New Message" />
      <FriendListDisplay onClick={handleClick} />
    </div>
  );
};
