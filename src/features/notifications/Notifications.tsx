import { NotificationCard } from "../../components/notification/NotificationCard";
import { useGetNotificationsQuery } from "../../services/api/endpoints/notifications/notifications.api";
import styles from "./styles/notifications.module.css";

export const Notifications = () => {
  const { data: userNotifications, isLoading } =
    useGetNotificationsQuery();

  return (
    <div className={styles.notificationPageDisplay}>
      {isLoading && <h1>Loading....</h1>}
      {userNotifications && userNotifications.length > 0 && (
        <>
          {userNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
        </>
      )}
      {!isLoading && userNotifications && userNotifications.length === 0 && (
        <h1>All caught up!</h1>
      )}
    </div>
  );
};
