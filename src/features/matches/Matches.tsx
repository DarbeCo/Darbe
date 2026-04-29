import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../services/hooks";
import { EventMatches } from "../events/eventMatches/EventMatches";
import { useGetEventsQuery, useGetVolunteerMatchesQuery } from "../../services/api/endpoints/events/events.api";
import { selectUserType } from "../users/selectors";
import { VolunteerMatches } from "../volunteerMatches/VolunteerMatches";
import { EDIT_PROFILE_ROUTE } from "../../routes/route.constants";
import { EDIT_SECTIONS } from "../users/userProfiles/constants";
import styles from "./styles/matches.module.css";

export const Matches = () => {
  const navigate = useNavigate();
  const userType = useAppSelector(selectUserType);
  const [isMatchFilterOpen, setIsMatchFilterOpen] = useState(false);
  const [isRecentFilterOpen, setIsRecentFilterOpen] = useState(false);
  const [selectedRecentFilter, setSelectedRecentFilter] = useState<
    "Most Recent" | "Least Recent" | "A - Z"
  >("Most Recent");
  const [selectedMatchFilter, setSelectedMatchFilter] = useState<
    | "Event Matches"
    | "Volunteer Matches"
    | "Cause Matches"
    | "Availability Matches"
  >(userType === "individual" ? "Event Matches" : "Volunteer Matches");

  const { data: eventMatchesData } = useGetEventsQuery(undefined, {
    skip: userType !== "individual",
  });
  const { data: volunteerMatchesData } = useGetVolunteerMatchesQuery(undefined, {
    skip: userType === "individual",
  });

  const matchCount =
    userType === "individual"
      ? eventMatchesData?.length ?? 0
      : volunteerMatchesData?.length ?? 0;
  const defaultMatchFilter =
    userType === "individual" ? "Event Matches" : "Volunteer Matches";
  const visibleMatchFilter =
    selectedMatchFilter === "Volunteer Matches" && userType === "individual"
      ? defaultMatchFilter
      : selectedMatchFilter === "Event Matches" && userType !== "individual"
        ? defaultMatchFilter
        : selectedMatchFilter;

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
      <h1 className={styles.matchesResponsiveTitle}>{visibleMatchFilter}</h1>
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

      <div className={styles.matchesFilterBar}>
        <span className={styles.matchesFilterTitle}>Filter</span>
        <div className={styles.matchesFilterControls}>
          <div className={styles.matchesFilterDropdownWrap}>
            <button
              type="button"
              className={styles.matchesFilterButton}
              onClick={() => {
                setIsMatchFilterOpen(false);
                setIsRecentFilterOpen((isOpen) => !isOpen);
              }}
              aria-expanded={isRecentFilterOpen}
            >
              {selectedRecentFilter}
              <span className={styles.matchesFilterCaret} aria-hidden="true" />
            </button>
            {isRecentFilterOpen && (
              <div
                className={`${styles.matchesFilterMenu} ${styles.matchesRecentFilterMenu}`}
              >
                <button
                  type="button"
                  className={
                    selectedRecentFilter === "Most Recent"
                      ? styles.matchesFilterMenuSelected
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
                      ? styles.matchesFilterMenuSelected
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
                      ? styles.matchesFilterMenuSelected
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
          <div className={styles.matchesFilterDropdownWrap}>
            <button
              type="button"
              className={styles.matchesFilterButton}
              onClick={() => {
                setIsRecentFilterOpen(false);
                setIsMatchFilterOpen((isOpen) => !isOpen);
              }}
              aria-expanded={isMatchFilterOpen}
            >
              {selectedMatchFilter}
              <span className={styles.matchesFilterCaret} aria-hidden="true" />
            </button>
            {isMatchFilterOpen && (
              <div className={styles.matchesFilterMenu}>
                <button
                  type="button"
                  className={
                    selectedMatchFilter === defaultMatchFilter
                      ? styles.matchesFilterMenuSelected
                      : ""
                  }
                  onClick={() => {
                    setSelectedMatchFilter(defaultMatchFilter);
                    setIsMatchFilterOpen(false);
                  }}
                >
                  {defaultMatchFilter}
                </button>
                <button
                  type="button"
                  className={
                    selectedMatchFilter === "Cause Matches"
                      ? styles.matchesFilterMenuSelected
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
                      ? styles.matchesFilterMenuSelected
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

      <div className={styles.matchesContent}>
        <h1 className={styles.matchesSectionTitle}>
          {visibleMatchFilter}
        </h1>
        {userType === "individual" ? (
          <EventMatches
            matchFilter={
              visibleMatchFilter as
                | "Event Matches"
                | "Cause Matches"
                | "Availability Matches"
            }
            recentFilter={selectedRecentFilter}
          />
        ) : (
          <VolunteerMatches
            matchFilter={
              visibleMatchFilter as
                | "Volunteer Matches"
                | "Cause Matches"
                | "Availability Matches"
            }
            recentFilter={selectedRecentFilter}
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
