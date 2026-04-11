import { useState } from "react";
import { CircularProgress } from "@mui/material";

import {
  useGetEventsQuery,
  useGetSignedUpEventsQuery,
} from "../../../services/api/endpoints/events/events.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";
import { useAppSelector } from "../../../services/hooks";
import { selectUserType } from "../../users/selectors";
import { DarbeButton } from "../../../components/buttons/DarbeButton";

import styles from "../styles/entityEvents.module.css";

// Render the events a user has already signed up for
export const EventSignup = () => {
  const userType = useAppSelector(selectUserType);
  const [whenFilter, setWhenFilter] = useState<"upcoming" | "past" | undefined>(
    undefined
  );

  const { data, isLoading } = useGetSignedUpEventsQuery({ when: whenFilter });
  const { data: entityEvents } = useGetEventsQuery();

  // if we are an individual, we show the events signed up for
  if (userType === "individual") {
    return (
      <div className={styles.darbeEventCards}>
        <div className={styles.eventFilterButtonContainer}>
          <DarbeButton
            isDisabled={whenFilter === "upcoming"}
            darbeButtonType="nextButton"
            buttonText="Upcoming"
            onClick={() => setWhenFilter("upcoming")}
          ></DarbeButton>
          <DarbeButton
            isDisabled={whenFilter === "past"}
            darbeButtonType="nextButton"
            buttonText="Past"
            onClick={() => setWhenFilter("past")}
          ></DarbeButton>
          <DarbeButton
            isDisabled={!whenFilter}
            darbeButtonType="nextButton"
            buttonText="All"
            onClick={() => setWhenFilter(undefined)}
          ></DarbeButton>
        </div>
        {isLoading && <CircularProgress />}
        {!isLoading &&
          data?.map(
            ({
              event,
              signupCount,
            }: {
              event: ShortEventState;
              signupCount: number;
            }) => (
              <EventCard event={event} isSignedUp signupCount={signupCount} />
            )
          )}
      </div>
    );
  }

  // If we are an entity, we show the events created by the entity
  if (userType !== "individual") {
    return (
      <div className={styles.darbeEventCards}>
        {isLoading && <CircularProgress />}
        {!isLoading &&
          entityEvents?.map((event) => <EventCard event={event} />)}
      </div>
    );
  }
};
