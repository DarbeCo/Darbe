import {
  AccessTime,
  CalendarToday,
  Close,
  Edit,
  HourglassTop,
  KeyboardArrowDown,
  Search,
  VolunteerActivism,
} from "@mui/icons-material";

import { DarbeButton } from "../../components/buttons/DarbeButton";
import { CreateEvent } from "../../services/api/endpoints/types/events.api.types";
import { useGetSimpleUserInfoQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useAppSelector } from "../../services/hooks";
import { selectUser } from "../users/selectors";
import { assetUrl } from "../../utils/assetUrl";
import { formatDarbeTimeToString } from "../../utils/CommonFunctions";

import styles from "./styles/postNeed.module.css";

interface InternalEventReviewProps {
  data: CreateEvent;
  onCancel: () => void;
  onSubmit: () => void;
}

const defaultProfilePicture = assetUrl("/images/defaultProfilePicture.jpg");
const defaultCoverPhoto = assetUrl("/images/defaultCoverPhoto.jpg");
const hasText = (value?: string | number) => Boolean(value?.toString().trim());

export const InternalEventReview = ({
  data,
  onCancel,
  onSubmit,
}: InternalEventReviewProps) => {
  const { user } = useAppSelector(selectUser);
  const { data: coordinator } = useGetSimpleUserInfoQuery(
    data.eventCoordinator,
  );

  const ownerName =
    user?.nonprofitName || user?.organizationName || user?.fullName || "Darbe";
  const coordinatorName =
    coordinator?.fullName ||
    coordinator?.organizationName ||
    coordinator?.nonprofitName ||
    "John Doe";
  const coordinatorPhoto = coordinator?.profilePicture || defaultProfilePicture;
  const coverPhoto = data.eventCoverPhoto || defaultCoverPhoto;
  const hasIndividualImpact = data.volunteerImpact.isIndividualImpact;
  const impactHours = hasIndividualImpact
    ? data.volunteerImpact.individualImpactPerHour
    : data.volunteerImpact.groupImpactPerHour;
  const impactText = hasIndividualImpact
    ? data.volunteerImpact.individualImpact
    : data.volunteerImpact.groupImpact;
  const hasImpact = hasText(impactHours) && hasText(impactText);
  const impactDisplay = `${impactHours} hr ${impactText}`;
  const eventDate = data.eventDate ? new Date(data.eventDate) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Sat, Apr 10";
  const eventDuration =
    data.startTime && data.endTime
      ? `${Math.max(data.endTime - data.startTime, 0)} Hours`
      : "4 Hours";
  const hasLocation =
    hasText(data.eventAddress.locationName) ||
    hasText(data.eventAddress.streetName) ||
    hasText(data.eventAddress.city);
  const hasRequirements =
    hasText(data.eventRequirements.supplies) ||
    hasText(data.eventRequirements.liftRequirements);
  const hasAttire = hasText(data.eventRequirements.attire);
  const hasAnyRequirements = hasRequirements || hasAttire;

  return (
    <div className={styles.internalReviewPage}>
      <div className={styles.internalReviewSearch}>
        <Search sx={{ color: "#000", fontSize: 21 }} />
        <span />
        <p>Search</p>
      </div>

      <div className={styles.internalReviewFilter}>
        <strong>Filter</strong>
        <div>
          <span>Most Recent</span>
          <KeyboardArrowDown sx={{ fontSize: 21 }} />
        </div>
        <div>
          <span>Event Matches</span>
          <KeyboardArrowDown sx={{ fontSize: 21 }} />
        </div>
      </div>

      <section className={styles.internalReviewHero}>
        <div className={styles.internalReviewHeroHeader}>
          <div className={styles.internalReviewOwner}>
            <img
              src={user?.profilePicture || defaultProfilePicture}
              alt=""
              onError={(event) => {
                event.currentTarget.src = defaultProfilePicture;
              }}
            />
            <span>{ownerName}</span>
          </div>
          <button type="button">Share</button>
          <Close sx={{ color: "#000", fontSize: 24 }} />
        </div>

        <h1>{data.eventName}</h1>

        <div className={styles.internalReviewHeroBody}>
          <img
            className={styles.internalReviewCover}
            src={coverPhoto}
            alt="Event cover"
            onError={(event) => {
              event.currentTarget.src = defaultCoverPhoto;
            }}
          />
          <div className={styles.internalReviewStats}>
            <div>
              <HourglassTop sx={{ fontSize: 24 }} />
              <strong>{eventDuration}</strong>
            </div>
            <div>
              <VolunteerActivism sx={{ fontSize: 24 }} />
              <strong>0/{data.maxVolunteerCount || 15} Volunteers</strong>
            </div>
            <div>
              <CalendarToday sx={{ fontSize: 24 }} />
              <strong>{formattedDate}</strong>
            </div>
            <div>
              <AccessTime sx={{ fontSize: 24 }} />
              <strong>{formatDarbeTimeToString(data.startTime) || "2:00 PM"}</strong>
            </div>
          </div>
        </div>
      </section>

      {hasText(data.eventDescription) && (
        <section className={styles.internalReviewWideCard}>
          <h2>Description</h2>
          <p>{data.eventDescription}</p>
        </section>
      )}

      <section className={styles.internalReviewInlineCard}>
        <h2>Occurance:</h2>
        <p>{data.isRepeating ? "Every week" : "One time"}</p>
      </section>

      {hasImpact && (
        <section className={styles.internalReviewInlineCard}>
          <h2>Volunteer Impact:</h2>
          <p>{impactDisplay}</p>
        </section>
      )}

      {(hasLocation || hasText(data.eventParkingInfo)) && (
        <div className={styles.internalReviewTwoColumn}>
          {hasLocation && (
            <section>
              <h2>Location</h2>
              {hasText(data.eventAddress.locationName) && (
                <p>{data.eventAddress.locationName}</p>
              )}
              {hasText(data.eventAddress.streetName) && (
                <a>{data.eventAddress.streetName}</a>
              )}
              {hasText(data.eventAddress.city) && (
                <a>{data.eventAddress.city}</a>
              )}
            </section>
          )}
          {hasText(data.eventParkingInfo) && (
            <section>
              <h2>Parking Detail</h2>
              <p>{data.eventParkingInfo}</p>
            </section>
          )}
        </div>
      )}

      {hasAnyRequirements && (
        <div className={styles.internalReviewTwoColumn}>
          {hasRequirements && (
            <section>
              {hasText(data.eventRequirements.supplies) && (
                <>
                  <h2>Requirements</h2>
                  <p>{data.eventRequirements.supplies}</p>
                </>
              )}
              {hasText(data.eventRequirements.liftRequirements) && (
                <>
                  <h2>Lift Requirements</h2>
                  <p>{data.eventRequirements.liftRequirements}</p>
                </>
              )}
            </section>
          )}
          {hasAttire && (
            <section>
              <h2>Attire</h2>
              <p>{data.eventRequirements.attire}</p>
            </section>
          )}
        </div>
      )}

      <section className={styles.internalReviewCoordinator}>
        <h2>Coordinator:</h2>
        <img
          src={coordinatorPhoto}
          alt=""
          onError={(event) => {
            event.currentTarget.src = defaultProfilePicture;
          }}
        />
        <span>{coordinatorName}</span>
        <Edit sx={{ fontSize: 16 }} />
      </section>

      <section className={styles.internalReviewWaivers}>
        <label>
          <input type="checkbox" checked={hasText(data.adultWaiver)} readOnly />
          <span>Adult waiver</span>
        </label>
        <label>
          <input type="checkbox" checked={hasText(data.minorWaiver)} readOnly />
          <span>Minor waiver</span>
        </label>
      </section>

      <div className={styles.internalReviewFooter}>
        <div className={styles.internalReviewActions}>
          <DarbeButton
            buttonText="Cancel"
            darbeButtonType="secondaryNextButton"
            onClick={onCancel}
          />
          <DarbeButton
            buttonText="Submit"
            darbeButtonType="nextButton"
            onClick={onSubmit}
          />
        </div>
      </div>
    </div>
  );
};
