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
  const impactDisplay = `${impactHours || "2"} hr ${impactText || "Office work"}`;
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

        <h1>{data.eventName || "Organization Meeting - Members Only"}</h1>

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

      <section className={styles.internalReviewWideCard}>
        <h2>Description</h2>
        <p>
          {data.eventDescription ||
            "Weekly organization meeting to welcome new members, review fundraising endeavors and potential opportunities, review current budget and plans, discuss updates about ongoing programs, and plans for upcoming programs."}
        </p>
      </section>

      <section className={styles.internalReviewInlineCard}>
        <h2>Occurance:</h2>
        <p>{data.isRepeating ? "Every week" : "One time"}</p>
      </section>

      <section className={styles.internalReviewInlineCard}>
        <h2>Volunteer Impact:</h2>
        <p>{impactDisplay}</p>
      </section>

      <div className={styles.internalReviewTwoColumn}>
        <section>
          <h2>Location</h2>
          <p>{data.eventAddress.locationName || "Two Tower Place"}</p>
          <a>{data.eventAddress.streetName || "123 Highway Street"}</a>
          <a>{data.eventAddress.city || "Dallas, TX 01234"}</a>
        </section>
        <section>
          <h2>Parking Detail</h2>
          <p>
            {data.eventParkingInfo ||
              "Parking is available in front of the building."}
          </p>
          <strong>{data.eventAddress.locationName || "Building number 21A"}</strong>
        </section>
      </div>

      <div className={styles.internalReviewTwoColumn}>
        <section>
          <h2>Requirements</h2>
          <p>{data.eventRequirements.supplies || "Pen\nPaper"}</p>
          <h2>Lift Requirements</h2>
          <p>{data.eventRequirements.liftRequirements || "None"}</p>
        </section>
        <section>
          <h2>Attire</h2>
          <p>{data.eventRequirements.attire || "Casual Clothes"}</p>
        </section>
      </div>

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
          <input type="checkbox" />
          <span>Adult waiver</span>
        </label>
        <label>
          <input type="checkbox" />
          <span>Minor waiver</span>
        </label>
      </section>

      <div className={styles.internalReviewFooter}>
        <div className={styles.internalReviewLink}>
          <strong>Event Link:</strong>
          <span>https://t.ly/brJXE</span>
        </div>
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
