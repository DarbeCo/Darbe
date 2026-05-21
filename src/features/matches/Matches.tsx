import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../services/hooks";
import {
  EventMatches,
  getUpcomingEventMatches,
} from "../events/eventMatches/EventMatches";
import {
  useGetEventsQuery,
  useGetVolunteerMatchesQuery,
} from "../../services/api/endpoints/events/events.api";
import { selectUserType } from "../users/selectors";
import { VolunteerMatches } from "../volunteerMatches/VolunteerMatches";
import { EDIT_PROFILE_ROUTE } from "../../routes/route.constants";
import { EDIT_SECTIONS } from "../users/userProfiles/constants";
import styles from "./styles/matches.module.css";

type OrganizationMatchTab = "eventVolunteers" | "recommendations";

export const Matches = () => {
  const navigate = useNavigate();
  const userType = useAppSelector(selectUserType);
  const isOrganization = userType === "organization";
  const [organizationMatchTab, setOrganizationMatchTab] =
    useState<OrganizationMatchTab>("eventVolunteers");

  const { data: eventMatchesData } = useGetEventsQuery(undefined, {
    skip: userType !== "individual",
  });
  const { data: recommendableEventMatchesData } = useGetEventsQuery(
    { scope: "recommendable" },
    {
      skip: !isOrganization,
    }
  );
  const { data: volunteerMatchesData } = useGetVolunteerMatchesQuery(undefined, {
    skip: userType === "individual",
  });

  const activeEventMatchesData = isOrganization
    ? recommendableEventMatchesData
    : eventMatchesData;
  const isRecommendationTab =
    isOrganization && organizationMatchTab === "recommendations";
  const showEventMatches = userType === "individual" || isRecommendationTab;
  const activeMatchTitle = isRecommendationTab
    ? "Matches to Recommend"
    : userType === "individual"
    ? "Event Matches"
    : isOrganization
    ? "My Event Volunteers"
    : "Matches";
  const volunteerMatchLabel = isOrganization
    ? "My Event Volunteers"
    : userType === "individual"
    ? "Event Matches"
    : "Volunteer Matches";

  const upcomingEventMatchCount = useMemo(
    () => getUpcomingEventMatches(activeEventMatchesData).length,
    [activeEventMatchesData]
  );
  const activeShowAllCount = showEventMatches
    ? upcomingEventMatchCount
    : volunteerMatchesData?.length ?? 0;

  const summaryCards = [
    {
      label: volunteerMatchLabel,
      value:
        userType === "individual"
          ? upcomingEventMatchCount
          : volunteerMatchesData?.length ?? 0,
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
      <h1 className={styles.matchesResponsiveTitle}>{activeMatchTitle}</h1>
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

      {isOrganization && (
        <div
          className={styles.matchesTabs}
          role="tablist"
          aria-label="Organization match views"
        >
          <button
            type="button"
            role="tab"
            aria-selected={organizationMatchTab === "eventVolunteers"}
            className={`${styles.matchesTab} ${
              organizationMatchTab === "eventVolunteers"
                ? styles.matchesTabActive
                : ""
            }`.trim()}
            onClick={() => setOrganizationMatchTab("eventVolunteers")}
          >
            My Event Volunteers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={organizationMatchTab === "recommendations"}
            className={`${styles.matchesTab} ${
              organizationMatchTab === "recommendations"
                ? styles.matchesTabActive
                : ""
            }`.trim()}
            onClick={() => setOrganizationMatchTab("recommendations")}
          >
            Matches to Recommend
          </button>
        </div>
      )}

      {userType === "individual" && (
        <div className={styles.matchesFilterBar}>
          <span className={styles.matchesFilterTitle}>Filter</span>
          <div className={styles.matchesFilterControls}>
            <span className={styles.matchesFilterButton}>Event Matches</span>
          </div>
        </div>
      )}

      <div className={styles.matchesContent}>
        <h1 className={styles.matchesSectionTitle}>{activeMatchTitle}</h1>
        {showEventMatches ? (
          <EventMatches
            hideLoadingSpinner
            queryScope={isRecommendationTab ? "recommendable" : "default"}
            showVolunteerAndPassActions={!isRecommendationTab}
          />
        ) : (
          <VolunteerMatches
            matchFilter="Volunteer Matches"
            recentFilter="Most Recent"
            hideLoadingSpinner
          />
        )}
        {activeShowAllCount > 0 && (
          <button type="button" className={styles.showAllButton}>
            Show all
          </button>
        )}
      </div>
    </div>
  );
};
