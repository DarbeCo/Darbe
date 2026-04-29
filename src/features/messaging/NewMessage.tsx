import { useLocation, useNavigate } from "react-router-dom";

import { FriendListDisplay } from "../../components/friends/FriendListDisplay";
import { SimpleHeader } from "../../components/simpleHeader/SimpleHeader";
import { FRIEND_MESSAGE_ROUTE } from "../../routes/route.constants";

import styles from "./styles/messaging.module.css";

export const NewMessage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sharedUrl =
    typeof location.state === "object" &&
    location.state &&
    "shareUrl" in location.state &&
    typeof location.state.shareUrl === "string"
      ? location.state.shareUrl
      : "";

  const handleClick = (friendId: string) => {
    navigate(FRIEND_MESSAGE_ROUTE(friendId), {
      state: sharedUrl ? { shareUrl: sharedUrl } : undefined,
    });
  };

  return (
    <div className={styles.newMessage}>
      <SimpleHeader textVariant="header" headerText="New Message" />
      <FriendListDisplay onClick={handleClick} />
    </div>
  );
};
