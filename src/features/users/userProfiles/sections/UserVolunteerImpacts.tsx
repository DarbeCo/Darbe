import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useGetUserImpactQuery } from "../../../../services/api/endpoints/impact/impact.api";
import { EventImpact } from "../../../../services/api/endpoints/types/impact.api.types";
import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../../../routes/route.constants";
import { assetUrl } from "../../../../utils/assetUrl";
import { parseEventDateAsLocalDate } from "../../../../utils/eventDateUtils";

import styles from "../styles/userProfiles.module.css";

interface UserVolunteerImpactsProps {
  userId?: string;
  title?: string;
}

const VOLUNTEER_VALUE_PER_HOUR = 33.49;
const COLLAPSED_IMPACT_COUNT = 3;

const getOwnerName = (impact: EventImpact) =>
  impact.event.eventOwner.organizationName ||
  impact.event.eventOwner.nonprofitName ||
  impact.event.eventOwner.fullName ||
  "Darbe Partner";

const formatDate = (eventDate: string) =>
  parseEventDateAsLocalDate(eventDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatNumber = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const formatCurrency = (value: number) =>
  `$ ${Math.round(value).toLocaleString("en-US")}`;

const getImpactMetric = (impact: EventImpact) => {
  const volunteerImpact = impact.event.volunteerImpact;
  const hasIndividualImpact = volunteerImpact.isIndividualImpact;
  const impactLabel = hasIndividualImpact
    ? volunteerImpact.individualImpact
    : volunteerImpact.groupImpact;
  const impactRate = Number(
    hasIndividualImpact
      ? volunteerImpact.individualImpactPerHour
      : volunteerImpact.groupImpactPerHour
  );
  const impactValue = Number.isFinite(impactRate)
    ? impactRate * Math.max(impact.hoursVolunteered, 1)
    : undefined;

  return {
    label: impactLabel || "Impact",
    value: impactValue === undefined ? "--" : formatNumber(impactValue),
  };
};

export const UserVolunteerImpacts = ({
  userId,
  title = "Volunteer Experiences and Impacts",
}: UserVolunteerImpactsProps) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const { data: userImpacts = [], isLoading } = useGetUserImpactQuery(
    userId ?? "",
    {
      skip: !userId,
      refetchOnMountOrArgChange: true,
    }
  );
  const visibleImpacts = showAll
    ? userImpacts
    : userImpacts.slice(0, COLLAPSED_IMPACT_COUNT);

  return (
    <section className={styles.userVolunteerImpacts}>
      <h2 className={styles.userVolunteerImpactsTitle}>{title}</h2>

      {isLoading && (
        <div className={styles.profileImpactLoading}>
          <CircularProgress size={24} />
        </div>
      )}

      {!isLoading && visibleImpacts.length === 0 && (
        <p className={styles.profileImpactEmpty}>
          No volunteer experiences or impacts added yet.
        </p>
      )}

      {!isLoading &&
        visibleImpacts.map((impact) => {
          const owner = impact.event.eventOwner;
          const ownerPhoto =
            owner.profilePicture || assetUrl("/images/defaultProfilePicture.jpg");
          const coverPhoto =
            impact.event.eventCoverPhoto ||
            assetUrl("/images/defaultCoverPhoto.jpg");
          const ownerName = getOwnerName(impact);
          const volunteerValue =
            impact.volunteerValue ||
            impact.hoursVolunteered * VOLUNTEER_VALUE_PER_HOUR;
          const impactMetric = getImpactMetric(impact);

          return (
            <article className={styles.profileImpactCard} key={impact.id}>
              <header className={styles.profileImpactHeader}>
                <button
                  type="button"
                  className={styles.profileImpactOwner}
                  onClick={() => navigate(`${PROFILE_ROUTE}/${owner.id}`)}
                >
                  <img src={ownerPhoto} alt="" />
                  <span>{ownerName}</span>
                </button>
                <button
                  type="button"
                  className={styles.profileImpactSeeMore}
                  onClick={() => navigate(`${EVENTS_ROUTE}/${impact.event.id}`)}
                >
                  See More
                </button>
              </header>

              <div className={styles.profileImpactEvent}>
                <img
                  className={styles.profileImpactEventImage}
                  src={coverPhoto}
                  alt={`event cover - ${impact.event.eventName}`}
                />
                <div className={styles.profileImpactEventText}>
                  <h3>{impact.event.eventName}</h3>
                  <time dateTime={impact.event.eventDate}>
                    {formatDate(impact.event.eventDate)}
                  </time>
                  <p>{impact.event.eventDescription}</p>
                </div>
              </div>

              <dl className={styles.profileImpactStats}>
                <div>
                  <dt>{formatNumber(impact.hoursVolunteered)}</dt>
                  <dd>Hours</dd>
                </div>
                <div>
                  <dt>{formatCurrency(volunteerValue)}</dt>
                  <dd>Volunteer Value</dd>
                </div>
                <div>
                  <dt>{impactMetric.value}</dt>
                  <dd>{impactMetric.label}</dd>
                </div>
              </dl>
            </article>
          );
        })}

      {!isLoading && userImpacts.length > COLLAPSED_IMPACT_COUNT && (
        <button
          type="button"
          className={styles.profileImpactShowAll}
          onClick={() => setShowAll((currentShowAll) => !currentShowAll)}
        >
          {showAll ? "Show less" : "Show all"}
        </button>
      )}
    </section>
  );
};
