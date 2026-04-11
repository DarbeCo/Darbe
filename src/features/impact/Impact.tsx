import { EventCard } from "../../components/events/EventCard";
import { useGetUserImpactQuery } from "../../services/api/endpoints/impact/impact.api";
import { useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../users/selectors";

import styles from "./styles/impact.module.css";

const ImpactPage = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const { data: userImpacts } = useGetUserImpactQuery(userId);

  return (
    <div className={styles.impact}>
      {userImpacts?.map((impact) => (
        <EventCard
          event={impact.event}
          isSignedUp={false}
          key={impact.id}
          impactView
        />
      ))}
    </div>
  );
};

export default ImpactPage;
