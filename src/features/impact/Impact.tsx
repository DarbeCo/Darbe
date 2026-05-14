import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useGetUserImpactQuery } from "../../services/api/endpoints/impact/impact.api";
import { EventImpact } from "../../services/api/endpoints/types/impact.api.types";
import { useAppSelector } from "../../services/hooks";
import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import { assetUrl } from "../../utils/assetUrl";
import { selectCurrentUserId } from "../users/selectors";
import { parseEventDateAsLocalDate } from "../../utils/eventDateUtils";

import styles from "./styles/impact.module.css";

const VOLUNTEER_VALUE_PER_HOUR = 33.49;

const getOwnerName = (impact: EventImpact) =>
  impact.event.eventOwner.organizationName ||
  impact.event.eventOwner.nonprofitName ||
  impact.event.eventOwner.fullName ||
  "Darbe Partner";

const formatDate = (eventDate: string) =>
  parseEventDateAsLocalDate(eventDate).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

const formatNumber = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const formatCurrency = (value: number) =>
  `$ ${Math.round(value).toLocaleString("en-US")}`;

const getImpactMetric = (impact: EventImpact) => {
  const { event, hoursVolunteered } = impact;
  const volunteerImpact = event.volunteerImpact;
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
    ? impactRate * Math.max(hoursVolunteered, 1)
    : undefined;

  return {
    label: impactLabel || "Impact",
    value: impactValue === undefined ? "--" : formatNumber(impactValue),
  };
};

const ImpactPage = () => {
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const { data: userImpacts = [], isLoading } = useGetUserImpactQuery(userId);

  const handleProfileClick = (ownerId: string) => {
    navigate(`${PROFILE_ROUTE}/${ownerId}`);
  };

  const handleDetailsClick = (eventId: string) => {
    navigate(`${EVENTS_ROUTE}/${eventId}`);
  };

  return (
    <section className={styles.impact}>
      <h1 className={styles.impactTitle}>Volunteer Experiences and Impacts</h1>
      {isLoading && (
        <div className={styles.impactLoading}>
          <CircularProgress />
        </div>
      )}
      {!isLoading && userImpacts.length === 0 && (
        <p className={styles.impactEmpty}>No volunteer impacts found.</p>
      )}
      {!isLoading &&
        userImpacts.map((impact) => {
          const owner = impact.event.eventOwner;
          const ownerName = getOwnerName(impact);
          const coverPhoto =
            impact.event.eventCoverPhoto ||
            assetUrl("/images/defaultCoverPhoto.jpg");
          const ownerPhoto =
            owner.profilePicture || assetUrl("/images/defaultProfilePicture.jpg");
          const volunteerValue =
            impact.volunteerValue ||
            impact.hoursVolunteered * VOLUNTEER_VALUE_PER_HOUR;
          const impactMetric = getImpactMetric(impact);

          return (
            <article className={styles.impactCard} key={impact.id}>
              <header className={styles.impactCardHeader}>
                <button
                  type="button"
                  className={styles.impactOwner}
                  onClick={() => handleProfileClick(owner.id)}
                >
                  <img src={ownerPhoto} alt="" />
                  <span>{ownerName}</span>
                </button>
                <button
                  type="button"
                  className={styles.impactSeeMore}
                  onClick={() => handleDetailsClick(impact.event.id)}
                >
                  See More
                </button>
              </header>

              <div className={styles.impactEvent}>
                <img
                  src={coverPhoto}
                  alt={`event cover - ${impact.event.eventName}`}
                  className={styles.impactEventImage}
                />
                <div className={styles.impactEventText}>
                  <h2>{impact.event.eventName}</h2>
                  <time dateTime={impact.event.eventDate}>
                    {formatDate(impact.event.eventDate)}
                  </time>
                  <p>{impact.event.eventDescription}</p>
                </div>
              </div>

              <dl className={styles.impactStats}>
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
    </section>
  );
};

export default ImpactPage;
