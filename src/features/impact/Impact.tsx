import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  useGetUserImpactQuery,
  useGetVolunteerValuePerHourQuery,
} from "../../services/api/endpoints/impact/impact.api";
import { EventImpact } from "../../services/api/endpoints/types/impact.api.types";
import { useAppSelector } from "../../services/hooks";
import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import { assetUrl } from "../../utils/assetUrl";
import { selectCurrentUserId } from "../users/selectors";
import { parseEventDateAsLocalDate } from "../../utils/eventDateUtils";

import styles from "./styles/impact.module.css";

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
  Number.isInteger(value) ? `${value}` : value.toFixed(2);

const formatCurrency = (value: number) =>
  `$ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getImpactText = (impact: EventImpact) => {
  const signupImpact = impact.volunteerImpact?.trim();
  if (signupImpact) {
    return signupImpact;
  }

  const { event } = impact;
  const volunteerImpact = event.volunteerImpact;
  const hasIndividualImpact = volunteerImpact.isIndividualImpact;

  return hasIndividualImpact
    ? volunteerImpact.individualImpact || "Impact"
    : volunteerImpact.groupImpact || "Impact";
};

const ImpactPage = () => {
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const { data: userImpacts = [], isLoading } = useGetUserImpactQuery(userId);
  const { data: volunteerValuePerHour = 33.59 } =
    useGetVolunteerValuePerHourQuery();

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
            impact.hoursVolunteered * volunteerValuePerHour;
          const impactText = getImpactText(impact);

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
                  {impactText && (
                    <p className={styles.impactEventImpact}>
                      <strong>Impact:</strong> {impactText}
                    </p>
                  )}
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
                  <dt className={styles.impactTextValue}>{impactText}</dt>
                  <dd>Impact</dd>
                </div>
              </dl>
            </article>
          );
        })}
    </section>
  );
};

export default ImpactPage;
