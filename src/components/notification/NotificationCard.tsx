import { useNavigate } from "react-router-dom";

import { Notification } from "./types";
import { UserAvatars } from "../avatars/UserAvatars";
import { formatDateTime } from "../../utils/CommonFunctions";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { Typography } from "../typography/Typography";

import styles from "./styles/notifications.module.css";

interface NotificationCardProps {
  notification: Notification;
}

export const NotificationCard = ({ notification }: NotificationCardProps) => {
  const navigate = useNavigate();
  const { senderUserId, contentType, createdAt } = notification;
  const formattedDate = formatDateTime(new Date(createdAt));

  const contentVerbiage = (type: string) => {
    switch (type) {
      case "like":
        return "liked something you created";
      case "comment":
        return "commented on a post you made";
      case "friendRequest":
        return "sent you a friend request";
      case "acceptedFriendRequest":
        return "accepted your friend request";
      case "follow":
        return "started following you";
      case "post":
        return "posted something new";
      default:
        return type;
    }
  };

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };
  const nameToUse = senderUserId?.fullName || senderUserId?.firstName;
  const basicText = `${nameToUse} ${contentVerbiage(contentType)}`;

  return (
    <div className={styles.notificationCard}>
      <UserAvatars
        onClick={() => handleClick(senderUserId.id)}
        profilePicture={senderUserId.profilePicture}
        fullName={senderUserId.fullName}
        timeStamp={formattedDate.toString()}
      />
      <Typography
        variant="informational"
        extraClass="paddingLeft paddingBottom"
        textToDisplay={basicText}
      ></Typography>
    </div>
  );
};
