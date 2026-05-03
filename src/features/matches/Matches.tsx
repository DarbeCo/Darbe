import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../services/hooks";
import {
  EventMatches,
  getUpcomingEventMatches,
} from "../events/eventMatches/EventMatches";
import { useGetEventsQuery, useGetVolunteerMatchesQuery } from "../../services/api/endpoints/events/events.api";
import { selectUserType } from "../users/selectors";
import { VolunteerMatches } from "../volunteerMatches/VolunteerMatches";
import { EDIT_PROFILE_ROUTE } from "../../routes/route.constants";
import { EDIT_SECTIONS } from "../users/userProfiles/constants";
import styles from "./styles/matches.module.css";

export const Matches = () => {
  const navigate = useNavigate();
  const userType = useAppSelector(selectUserType);

  const { data: eventMatchesData } = useGetEventsQuery(undefined, {
    skip: userType !== "individual",
  });
  const { data: volunteerMatchesData } = useGetVolunteerMatchesQuery(undefined, {
    skip: userType === "individual",
  });

  const upcomingEventMatchCount = useMemo(
    () => getUpcomingEventMatches(eventMatchesData).length,
    [eventMatchesData]
  );
  const matchCount =
    userType === "individual"
      ? upcomingEventMatchCount
      : volunteerMatchesData?.length ?? 0;
  const defaultMatchFilter =
    userType === "individual" ? "Event Matches" : "Volunteer Matches";

  const summaryCards = [
    {
      label: userType === "individual" ? "Event Matches" : "Volunteer Matches",
      value: matchCount,
      delta: "+1 since last month",
      editSection: undefined,
    },
    {
      label: "Cause Matches",
      value: 0,
      delta: "+2 since last month",
      editSection: EDIT_SECTIONS.causes,
    },
    {
      label: "Availability Matches",
      value: 0,
      delta: "0 since last month",
      editSection: EDIT_SECTIONS.availability,
    },
  ];

  const handleEditSummaryCard = (section?: string) => {
    if (section) {
      navigate(`${EDIT_PROFILE_ROUTE}?section=${section}`);
    }
  };

  return (
    <div className={styles.matchesPage}>
      <h1 className={styles.matchesResponsiveTitle}>{defaultMatchFilter}</h1>
      <div className={styles.matchesSummaryPanel}>
        <p className={styles.matchesTitle}>
          Matches based on your selected causes and availability
        </p>
        <div className={styles.matchesCards}>
          {summaryCards.map((card) => {
            const isDeltaZero = card.delta.startsWith("0");

            return (
              <div className={styles.summaryCard} key={card.label}>
                <div className={styles.summaryCardHeader}>
                  {card.editSection ? (
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => handleEditSummaryCard(card.editSection)}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                <div className={styles.summaryCardLabel}>{card.label}</div>
                <div className={styles.summaryCardNumber}>{card.value}</div>
                <div
                  className={`${styles.summaryCardDelta} ${
                    isDeltaZero ? styles.summaryCardDeltaNegative : ""
                  }`}
                >
                  {card.delta}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {userType === "individual" && (
        <div className={styles.matchesFilterBar}>
          <span className={styles.matchesFilterTitle}>Filter</span>
          <div className={styles.matchesFilterControls}>
            <span className={styles.matchesFilterButton}>Event Matches</span>
          </div>
        </div>
      )}

      <div className={styles.matchesContent}>
        <h1 className={styles.matchesSectionTitle}>{defaultMatchFilter}</h1>
        {userType === "individual" ? (
          <EventMatches />
        ) : (
          <VolunteerMatches
            matchFilter="Volunteer Matches"
            recentFilter="Most Recent"
          />
        )}
        {matchCount > 0 && (
          <button type="button" className={styles.showAllButton}>
            Show all
          </button>
        )}
      </div>
    </div>
  );
};
