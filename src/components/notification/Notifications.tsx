import { NotificationsActive, NotificationsNone } from "@mui/icons-material";
import { Badge, IconButton } from "@mui/material";

import { useNavigateHook } from "../../utils/commonHooks/UseNavigate";
import { NOTIFICATIONS_ROUTE } from "../../routes/route.constants";
import {
  useGetNotificationCountQuery,
  useMarkNotificationsReadMutation,
} from "../../services/api/endpoints/notifications/notifications.api";

import styles from "./styles/notifications.module.css";

export const Notifications = () => {
  const { data } = useGetNotificationCountQuery(undefined, {
    pollingInterval: 7500,
    skipPollingIfUnfocused: true,
  });
  const navigate = useNavigateHook();
  const [markNotificationsRead] = useMarkNotificationsReadMutation();

  const handleClick = async () => {
    try {
      await markNotificationsRead();
      navigate(NOTIFICATIONS_ROUTE);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return (
    <div className={styles.notificationsArea}>
      {(data || 0) > 0 ? (
        <IconButton onClick={handleClick}>
          <Badge badgeContent={data} color="primary">
            <NotificationsActive />
          </Badge>
        </IconButton>
      ) : (
        <IconButton onClick={handleClick}>
          <NotificationsNone />
        </IconButton>
      )}
    </div>
  );
};
