import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  useGetUserImpactQuery,
  useGetVolunteerValuePerHourQuery,
} from "../../../../services/api/endpoints/impact/impact.api";
import { EventImpact } from "../../../../services/api/endpoints/types/impact.api.types";
import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../../../routes/route.constants";
import { useAppDispatch } from "../../../../services/hooks";
import {
  setExternalData,
  setModalType,
  showModal,
} from "../../../../components/modal/modalSlice";
import { EDIT_SECTIONS } from "../constants";
import { assetUrl } from "../../../../utils/assetUrl";
import { parseEventDateAsLocalDate } from "../../../../utils/eventDateUtils";

import styles from "../styles/userProfiles.module.css";

interface UserVolunteerImpactsProps {
  userId?: string;
  canEdit?: boolean;
  title?: string;
}

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

  const volunteerImpact = impact.event.volunteerImpact;

  return volunteerImpact.isIndividualImpact
    ? volunteerImpact.individualImpact || ""
    : volunteerImpact.groupImpact || "";
};

export const UserVolunteerImpacts = ({
  userId,
  canEdit = false,
  title = "Volunteer Experiences and Impacts",
}: UserVolunteerImpactsProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const { data: userImpacts = [], isLoading } = useGetUserImpactQuery(
    userId ?? "",
    {
      skip: !userId,
      refetchOnMountOrArgChange: true,
    }
  );
  const { data: volunteerValuePerHour = 33.59 } =
    useGetVolunteerValuePerHourQuery();
  const visibleImpacts = showAll
    ? userImpacts
    : userImpacts.slice(0, COLLAPSED_IMPACT_COUNT);
  const openEventPhotos = (eventId: string) => {
    dispatch(setExternalData({ eventId, entityId: "" }));
    dispatch(setModalType(EDIT_SECTIONS.eventPhotoCarousel));
    dispatch(showModal());
  };
  const openEvent = (eventId: string) => {
    navigate(`${EVENTS_ROUTE}/${eventId}`);
  };

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
            impact.hoursVolunteered * volunteerValuePerHour;
          const impactText = getImpactText(impact);

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

              <button
                type="button"
                className={`${styles.profileImpactEvent} ${
                  canEdit ? styles.profileImpactEventClickable : ""
                }`.trim()}
                onClick={() => canEdit && openEvent(impact.event.id)}
                disabled={!canEdit}
              >
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
                  {impactText && (
                    <p className={styles.profileImpactEventImpact}>
                      <strong>Impact:</strong> {impactText}
                    </p>
                  )}
                </div>
              </button>

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
                  <dt>
                    <button
                      type="button"
                      className={styles.profileImpactPhotosLink}
                      onClick={() => openEventPhotos(impact.event.id)}
                    >
                      View Photos
                    </button>
                  </dt>
                  <dd>Event Photos</dd>
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
