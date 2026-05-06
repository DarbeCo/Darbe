import { NotificationCard } from "../../components/notification/NotificationCard";
import { useGetNotificationsQuery } from "../../services/api/endpoints/notifications/notifications.api";
import styles from "./styles/notifications.module.css";

export const Notifications = () => {
  const { data: userNotifications, isLoading } =
    useGetNotificationsQuery();
  const hasNotifications = Boolean(userNotifications?.length);

  return (
    <section className={styles.notificationPageDisplay}>
      <div className={styles.notificationPanel}>
        <h1>Notifications</h1>
        {isLoading && !userNotifications && (
          <p className={styles.notificationStatus}>Loading...</p>
        )}
        {hasNotifications && userNotifications && (
          <div className={styles.notificationList}>
          {userNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
          </div>
        )}
        {!isLoading && userNotifications && userNotifications.length === 0 && (
          <p className={styles.notificationStatus}>All caught up!</p>
        )}
      </div>
    </section>
  );
};
