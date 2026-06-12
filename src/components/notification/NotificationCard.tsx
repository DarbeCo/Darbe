import { useNavigate } from "react-router-dom";
import {
  ChatBubble,
  Check,
  Favorite,
  PersonAdd,
  PostAdd,
  AccountTree,
} from "@mui/icons-material";
import { useState } from "react";

import { Notification } from "./types";
import { formatDateTime } from "../../utils/CommonFunctions";
import { HIERARCHY_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import { DATE_CONSTANTS } from "../../utils/CommonConstants";
import { assetUrl } from "../../utils/assetUrl";
import {
  useAcceptFriendRequestMutation,
  useAcceptOrgJoinRequestMutation,
  useDenyFriendRequestMutation,
  useDenyOrgJoinRequestMutation,
} from "../../services/api/endpoints/friends/friends.api";
import {
  useAcceptEntityChildRequestMutation,
  useRejectEntityChildRequestMutation,
} from "../../services/api/endpoints/entityHierarchy/entityHierarchy.api";

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
  const [acceptFriendRequest, { isLoading: isAcceptingFriendRequest }] =
    useAcceptFriendRequestMutation();
  const [denyFriendRequest, { isLoading: isDenyingFriendRequest }] =
    useDenyFriendRequestMutation();
  const [acceptEntityChildRequest, { isLoading: isAcceptingHierarchyRequest }] =
    useAcceptEntityChildRequestMutation();
  const [rejectEntityChildRequest, { isLoading: isRejectingHierarchyRequest }] =
    useRejectEntityChildRequestMutation();
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
          previewText: notification.read
            ? "This friend request has been handled."
            : "Accept or reject this friend request.",
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
      case "entityHierarchyChildRequest":
        return {
          icon: <AccountTree />,
          iconClassName: styles.notificationFollowBadge,
          actionText: "added you as a child entity.",
          previewText: notification.read
            ? "This hierarchy request has been handled."
            : "Accept or reject this hierarchy request.",
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

  const handleHierarchyClick = () => {
    navigate(`${HIERARCHY_ROUTE}/${senderUserId.id}`);
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

  const handleAcceptFriendRequest = async () => {
    try {
      await acceptFriendRequest(senderUserId.id).unwrap();
      setActionDialogMessage("Friend request accepted.");
      setTimeout(() => setActionDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error accepting friend request", error);
      setActionDialogMessage("Unable to accept this friend request.");
      setTimeout(() => setActionDialogMessage(""), 1800);
    }
  };

  const handleDenyFriendRequest = async () => {
    try {
      await denyFriendRequest(senderUserId.id).unwrap();
      setActionDialogMessage("Friend request rejected.");
      setTimeout(() => setActionDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error rejecting friend request", error);
      setActionDialogMessage("Unable to reject this friend request.");
      setTimeout(() => setActionDialogMessage(""), 1800);
    }
  };

  const handleAcceptHierarchyRequest = async () => {
    try {
      await acceptEntityChildRequest(contentTypeId).unwrap();
      setActionDialogMessage("Hierarchy request accepted.");
      setTimeout(() => setActionDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error accepting hierarchy request", error);
      setActionDialogMessage("Unable to accept this hierarchy request.");
      setTimeout(() => setActionDialogMessage(""), 1800);
    }
  };

  const handleRejectHierarchyRequest = async () => {
    try {
      await rejectEntityChildRequest(contentTypeId).unwrap();
      setActionDialogMessage("Hierarchy request rejected.");
      setTimeout(() => setActionDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error rejecting hierarchy request", error);
      setActionDialogMessage("Unable to reject this hierarchy request.");
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
  const isFriendRequest = contentType === "friendRequest" && !notification.read;
  const isHierarchyRequest =
    contentType === "entityHierarchyChildRequest" && !notification.read;
  const isJoinActionLoading = isAcceptingJoinRequest || isDenyingJoinRequest;
  const isFriendActionLoading =
    isAcceptingFriendRequest || isDenyingFriendRequest;
  const isHierarchyActionLoading =
    isAcceptingHierarchyRequest || isRejectingHierarchyRequest;

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
          <button
            type="button"
            onClick={
              contentType === "entityHierarchyChildRequest"
                ? handleHierarchyClick
                : () => handleClick(senderUserId.id)
            }
          >
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
        {isFriendRequest && (
          <div className={styles.notificationActions}>
            <button
              type="button"
              className={styles.notificationAcceptButton}
              onClick={handleAcceptFriendRequest}
              disabled={isFriendActionLoading}
            >
              Accept
            </button>
            <button
              type="button"
              className={styles.notificationDenyButton}
              onClick={handleDenyFriendRequest}
              disabled={isFriendActionLoading}
            >
              Reject
            </button>
          </div>
        )}
        {isHierarchyRequest && (
          <div className={styles.notificationActions}>
            <button
              type="button"
              className={styles.notificationAcceptButton}
              onClick={handleAcceptHierarchyRequest}
              disabled={isHierarchyActionLoading}
            >
              Accept
            </button>
            <button
              type="button"
              className={styles.notificationDenyButton}
              onClick={handleRejectHierarchyRequest}
              disabled={isHierarchyActionLoading}
            >
              Reject
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
