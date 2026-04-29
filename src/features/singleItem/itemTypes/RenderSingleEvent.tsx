import { useState } from "react";
import { CircularProgress } from "@mui/material";

import { useGetEventDetailsQuery } from "../../../services/api/endpoints/events/events.api";
import { EventDetailCard } from "../../../components/events/EventDetailCard";

import styles from "../styles/singleItems.module.css";

interface RenderSingleEventProps {
  userId: string;
  eventId: string;
}

// TODO: Fill me out once post a need cards are done
export const RenderSingleEvent = ({
  userId,
  eventId,
}: RenderSingleEventProps) => {
  const [isMatchFilterOpen, setIsMatchFilterOpen] = useState(false);
  const [isRecentFilterOpen, setIsRecentFilterOpen] = useState(false);
  const [selectedRecentFilter, setSelectedRecentFilter] = useState<
    "Most Recent" | "Least Recent" | "A - Z"
  >("Most Recent");
  const [selectedMatchFilter, setSelectedMatchFilter] = useState<
    "Event Matches" | "Cause Matches" | "Availability Matches"
  >("Event Matches");
  const { data, isLoading } = useGetEventDetailsQuery(eventId);
  const isEventOwner = data?.eventOwner?.id === userId;

  return (
    <div className={styles.renderSingleItem}>
      <div className={styles.singleEventFilterBar}>
        <span className={styles.singleEventFilterTitle}>Filter</span>
        <div className={styles.singleEventFilterControls}>
          <div className={styles.singleEventFilterDropdownWrap}>
            <button
              type="button"
              onClick={() => {
                setIsMatchFilterOpen(false);
                setIsRecentFilterOpen((isOpen) => !isOpen);
              }}
              aria-expanded={isRecentFilterOpen}
            >
              {selectedRecentFilter}
              <span
                className={styles.singleEventFilterCaret}
                aria-hidden="true"
              />
            </button>
            {isRecentFilterOpen && (
              <div
                className={`${styles.singleEventFilterMenu} ${styles.singleEventRecentFilterMenu}`}
              >
                <button
                  type="button"
                  className={
                    selectedRecentFilter === "Most Recent"
                      ? styles.singleEventFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedRecentFilter("Most Recent");
                    setIsRecentFilterOpen(false);
                  }}
                >
                  Most Recent
                </button>
                <button
                  type="button"
                  className={
                    selectedRecentFilter === "Least Recent"
                      ? styles.singleEventFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedRecentFilter("Least Recent");
                    setIsRecentFilterOpen(false);
                  }}
                >
                  Least Recent
                </button>
                <button
                  type="button"
                  className={
                    selectedRecentFilter === "A - Z"
                      ? styles.singleEventFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedRecentFilter("A - Z");
                    setIsRecentFilterOpen(false);
                  }}
                >
                  A - Z
                </button>
              </div>
            )}
          </div>
          <div className={styles.singleEventFilterDropdownWrap}>
            <button
              type="button"
              onClick={() => {
                setIsRecentFilterOpen(false);
                setIsMatchFilterOpen((isOpen) => !isOpen);
              }}
              aria-expanded={isMatchFilterOpen}
            >
              {selectedMatchFilter}
              <span
                className={styles.singleEventFilterCaret}
                aria-hidden="true"
              />
            </button>
            {isMatchFilterOpen && (
              <div className={styles.singleEventFilterMenu}>
                <button
                  type="button"
                  className={
                    selectedMatchFilter === "Event Matches"
                      ? styles.singleEventFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedMatchFilter("Event Matches");
                    setIsMatchFilterOpen(false);
                  }}
                >
                  Event Matches
                </button>
                <button
                  type="button"
                  className={
                    selectedMatchFilter === "Cause Matches"
                      ? styles.singleEventFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedMatchFilter("Cause Matches");
                    setIsMatchFilterOpen(false);
                  }}
                >
                  Cause Matches
                </button>
                <button
                  type="button"
                  className={
                    selectedMatchFilter === "Availability Matches"
                      ? styles.singleEventFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedMatchFilter("Availability Matches");
                    setIsMatchFilterOpen(false);
                  }}
                >
                  Availability Matches
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isLoading && <CircularProgress />}
      {!isLoading && data && (
        <EventDetailCard
          event={data}
          eventId={eventId}
          isEventOwner={isEventOwner}
        />
      )}
    </div>
  );
};
