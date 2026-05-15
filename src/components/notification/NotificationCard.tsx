import { useNavigate } from "react-router-dom";
import {
  ChatBubble,
  Check,
  Favorite,
  PersonAdd,
  PostAdd,
} from "@mui/icons-material";
import { useState } from "react";

import { Notification } from "./types";
import { formatDateTime } from "../../utils/CommonFunctions";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { DATE_CONSTANTS } from "../../utils/CommonConstants";
import { assetUrl } from "../../utils/assetUrl";
import {
  useAcceptOrgJoinRequestMutation,
  useDenyOrgJoinRequestMutation,
} from "../../services/api/endpoints/friends/friends.api";

import styles from "./styles/notifications.module.css";

interface NotificationCardProps {
  notification: Notification;
}

export const NotificationCard = ({ notification }: NotificationCardProps) => {
  const navigate = useNavigate();
  const { senderUserId, recipientUserId, contentType, contentTypeId, createdAt } =
    notification;
  const [acceptOrgJoinRequest, { isLoading: isAcceptingJoinRequest }] =
    useAcceptOrgJoinRequestMutation();
  const [denyOrgJoinRequest, { isLoading: isDenyingJoinRequest }] =
    useDenyOrgJoinRequestMutation();
  const [actionDialogMessage, setActionDialogMessage] = useState("");
  const formattedDate = formatDateTime(createdAt, DATE_CONSTANTS.N_TIME_AGO);

  const getNotificationDetails = (type: Notification["contentType"]) => {
    const senderIsIndividual = senderUserId.userType === "individual";
    const recipientIsEntity =
      recipientUserId.userType === "organization" ||
      recipientUserId.userType === "nonprofit";

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
      case "orgJoinRequest":
        return {
          icon: <PersonAdd />,
          iconClassName: styles.notificationFriendBadge,
          actionText: "requested to join your organization.",
          previewText: "Accept or deny this member request.",
        };
      case "acceptedOrgJoinRequest":
        if (senderIsIndividual && recipientIsEntity) {
          return {
            icon: <Check />,
            iconClassName: styles.notificationAcceptedBadge,
            actionText: "has been accepted into your organization.",
            previewText: "This member request is complete.",
          };
        }

        return {
          icon: <Check />,
          iconClassName: styles.notificationAcceptedBadge,
          actionText: "accepted your organization join request.",
          previewText: "You are now a member.",
        };
      case "deniedOrgJoinRequest":
        if (senderIsIndividual && recipientIsEntity) {
          return {
            icon: <PersonAdd />,
            iconClassName: styles.notificationFriendBadge,
            actionText: "has been denied from joining your organization.",
            previewText: "This member request is complete.",
          };
        }

        return {
          icon: <PersonAdd />,
          iconClassName: styles.notificationFriendBadge,
          actionText: "declined your organization join request.",
          previewText: "View their profile to learn more.",
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

  const handleAcceptOrgJoinRequest = async () => {
    try {
      await acceptOrgJoinRequest(contentTypeId).unwrap();
      setActionDialogMessage("Member request accepted.");
      setTimeout(() => setActionDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error accepting organization join request", error);
      setActionDialogMessage("Unable to accept this member request.");
      setTimeout(() => setActionDialogMessage(""), 1800);
    }
  };

  const handleDenyOrgJoinRequest = async () => {
    try {
      await denyOrgJoinRequest(contentTypeId).unwrap();
      setActionDialogMessage("Member request denied.");
      setTimeout(() => setActionDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error denying organization join request", error);
      setActionDialogMessage("Unable to deny this member request.");
      setTimeout(() => setActionDialogMessage(""), 1800);
    }
  };
  const nameToUse =
    senderUserId?.fullName ||
    senderUserId?.organizationName ||
    senderUserId?.nonprofitName ||
    senderUserId?.firstName ||
    "Someone";
  const notificationDetails = getNotificationDetails(contentType);
  const isJoinRequest = contentType === "orgJoinRequest";
  const isJoinActionLoading = isAcceptingJoinRequest || isDenyingJoinRequest;

  return (
    <>
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
        {isJoinRequest && (
          <div className={styles.notificationActions}>
            <button
              type="button"
              className={styles.notificationAcceptButton}
              onClick={handleAcceptOrgJoinRequest}
              disabled={isJoinActionLoading}
            >
              Accept
            </button>
            <button
              type="button"
              className={styles.notificationDenyButton}
              onClick={handleDenyOrgJoinRequest}
              disabled={isJoinActionLoading}
            >
              Deny
            </button>
          </div>
        )}
      </div>
    </article>
    {actionDialogMessage && (
      <div className={styles.notificationDialogOverlay}>
        <div className={styles.notificationDialog} role="status">
          <h2 className={styles.notificationDialogTitle}>
            <span className={styles.notificationDialogIcon} aria-hidden="true" />
            <span>{actionDialogMessage}</span>
          </h2>
        </div>
      </div>
    )}
    </>
  );
};
