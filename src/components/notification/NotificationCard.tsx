import { useNavigate } from "react-router-dom";
import {
  ChatBubble,
  Check,
  Favorite,
  PersonAdd,
  PostAdd,
} from "@mui/icons-material";

import { Notification } from "./types";
import { formatDateTime } from "../../utils/CommonFunctions";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { DATE_CONSTANTS } from "../../utils/CommonConstants";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/notifications.module.css";

interface NotificationCardProps {
  notification: Notification;
}

export const NotificationCard = ({ notification }: NotificationCardProps) => {
  const navigate = useNavigate();
  const { senderUserId, contentType, createdAt } = notification;
  const formattedDate = formatDateTime(createdAt, DATE_CONSTANTS.N_TIME_AGO);

  const getNotificationDetails = (type: Notification["contentType"]) => {
    switch (type) {
      case "like":
        return {
          icon: <Favorite />,
          iconClassName: styles.notificationLikeBadge,
          actionText: "liked your post.",
          previewText: "Open the related activity to see more.",
        };
      case "comment":
        return {
          icon: <ChatBubble />,
          iconClassName: styles.notificationCommentBadge,
          actionText: "commented on your post.",
          previewText: "Open the related comment to see more.",
        };
      case "friendRequest":
        return {
          icon: <PersonAdd />,
          iconClassName: styles.notificationFriendBadge,
          actionText: "sent you a friend request.",
          previewText: "View their profile to respond.",
        };
      case "acceptedFriendRequest":
        return {
          icon: <Check />,
          iconClassName: styles.notificationAcceptedBadge,
          actionText: "accepted your friend request.",
          previewText: "You are now connected.",
        };
      case "follow":
        return {
          icon: <PersonAdd />,
          iconClassName: styles.notificationFollowBadge,
          actionText: "started following you.",
          previewText: "View their profile to see more.",
        };
      case "post":
        return {
          icon: <PostAdd />,
          iconClassName: styles.notificationPostBadge,
          actionText: "posted something new.",
          previewText: "Open their profile to see the latest activity.",
        };
      default:
        return {
          icon: <PostAdd />,
          iconClassName: styles.notificationPostBadge,
          actionText: "sent you a notification.",
          previewText: "Open their profile to see more.",
        };
    }
  };

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };
  const nameToUse =
    senderUserId?.fullName ||
    senderUserId?.organizationName ||
    senderUserId?.nonprofitName ||
    senderUserId?.firstName ||
    "Someone";
  const notificationDetails = getNotificationDetails(contentType);

  return (
    <article className={styles.notificationCard}>
      <button
        type="button"
        className={styles.notificationAvatarButton}
        onClick={() => handleClick(senderUserId.id)}
        aria-label={`Open ${nameToUse} profile`}
      >
        <img
          className={styles.notificationAvatar}
          src={
            senderUserId.profilePicture ||
            assetUrl("/images/defaultProfilePicture.jpg")
          }
          alt=""
        />
        <span
          className={`${styles.notificationTypeBadge} ${notificationDetails.iconClassName}`}
          aria-hidden="true"
        >
          {notificationDetails.icon}
        </span>
      </button>

      <div className={styles.notificationBody}>
        <div className={styles.notificationHeader}>
          <p>
            <button type="button" onClick={() => handleClick(senderUserId.id)}>
              {nameToUse}
            </button>{" "}
            <span>{notificationDetails.actionText}</span>
          </p>
          <span className={styles.notificationMeta}>{formattedDate}</span>
        </div>
        <p className={styles.notificationPreview}>
          {notificationDetails.previewText}{" "}
          <button type="button" onClick={() => handleClick(senderUserId.id)}>
            see more
          </button>
        </p>
      </div>
    </article>
  );
};
