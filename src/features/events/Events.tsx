import { useAppSelector } from "../../services/hooks";
import { selectUserType } from "../users/selectors";
import { EntityEvents } from "./entityEvents/EntityEvents";
import { EventMatches } from "./eventMatches/EventMatches";

import styles from "./styles/entityEvents.module.css";

export const Events = () => {
  const userType = useAppSelector(selectUserType);
  return (
    <div className={styles.eventDisplay}>
      {userType === "individual" ? <EventMatches /> : <EntityEvents />}
    </div>
  );
};
