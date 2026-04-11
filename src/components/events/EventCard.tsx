import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import { ShortEventState } from "../../services/api/endpoints/types/events.api.types";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { DarbeButton } from "../buttons/DarbeButton";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import {
  formatDarbeTimeToString,
  getUserStateFromZip,
} from "../../utils/CommonFunctions";
import { useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../../features/users/selectors";

import styles from "./styles/eventCards.module.css";
import {
  usePassOnEventMutation,
  useVolunteerForEventMutation,
} from "../../services/api/endpoints/events/events.api";

interface EventCardProps {
  event: ShortEventState;
  isSignedUp?: boolean;
  signupCount?: number;
  impactView?: boolean;
}

export const EventCard = ({
  event,
  isSignedUp,
  signupCount = 0,
  impactView = false,
}: EventCardProps) => {
  const navigate = useNavigate();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const [passOnEvent] = usePassOnEventMutation();
  const [volunteerForEvent] = useVolunteerForEventMutation();

  const handleAvatarClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  const handlePassEvent = () => {
    const eventId = event.id;
    passOnEvent(eventId);
  };

  const handleVolunteerEvent = () => {
    const eventId = event.id;
    volunteerForEvent(eventId);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/home/events/${event.id}`
    );
  };

  const eventState = getUserStateFromZip(event.eventAddress.zipCode)?.st;
  const locationText = `${event.eventAddress.city}, ${eventState}`;
  const displayName =
    event.eventOwner.userType === "organization"
      ? event.eventOwner.organizationName
      : event.eventOwner.nonprofitName;

  const eventDuration = event?.endTime
    ? `${event.endTime - event.startTime} Hours`
    : "? Hours";

  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const calculatedEventDuration = event.endTime
    ? event.endTime - event.startTime
    : undefined;
  const formattedStartTime = formatDarbeTimeToString(event.startTime);
  const signupValueToUse =
    signupCount > 0 ? signupCount : event.signups?.length || 0;
  const signedUpVolunteers = `${signupValueToUse}/${event.maxVolunteerCount} Signed Up`;
  const isEventPoster = currentUserId === event.eventOwner.id;

  // TODO: Move out to a hook/util?
  const calculateEventImpact = () => {
    let totalEventGroupGoal;
    let totalEventIndivdualGoal;
    let eventImpactText = "";

    if (event.volunteerImpact.isIndividualImpact) {
      if (calculatedEventDuration) {
        totalEventIndivdualGoal =
          parseInt(event.volunteerImpact.individualImpactPerHour ?? "1") *
          event.maxVolunteerCount *
          calculatedEventDuration;

        eventImpactText = `${totalEventIndivdualGoal} ${event.volunteerImpact.individualImpact}`;
      } else {
        totalEventIndivdualGoal =
          parseInt(event.volunteerImpact.individualImpactPerHour ?? "1") *
          event.maxVolunteerCount;

        eventImpactText = `${totalEventIndivdualGoal} ${event.volunteerImpact.individualImpact}`;
      }
    }
    if (event.volunteerImpact.isGroupImpact) {
      if (calculatedEventDuration) {
        totalEventGroupGoal =
          parseInt(event.volunteerImpact.groupImpactPerHour ?? "1") *
          event.maxVolunteerCount *
          calculatedEventDuration;

        eventImpactText = `${totalEventGroupGoal} ${event.volunteerImpact.groupImpact}`;
      } else {
        totalEventGroupGoal =
          parseInt(event.volunteerImpact.groupImpactPerHour ?? "1") *
          event.maxVolunteerCount;

        eventImpactText = `${totalEventGroupGoal} ${event.volunteerImpact.groupImpact}`;
      }
    }

    return eventImpactText;
  };

  const handleDetailsClick = () => {
    navigate(`${EVENTS_ROUTE}/${event.id}`);
  };

  const eventImpactText = calculateEventImpact();

  return (
    <div className={styles.eventMatchPreview}>
      <div className={styles.eventMatchHeader}>
        <div className={styles.eventMatchHeaderUserInfo}>
          <UserAvatars
            profilePicture={event.eventOwner.profilePicture}
            onClick={() => handleAvatarClick(event.eventOwner.id)}
          />
          <Typography variant="blueTextNormal" textToDisplay={displayName} />
        </div>
        <div className={styles.eventMatchHeaderDetails}>
          <IconButton onClick={handleCopyLink}>
            <ContentCopy />
          </IconButton>
          <Typography
            variant="blueTextNormal"
            textToDisplay={"Details"}
            onClick={handleDetailsClick}
            extraClass="clickable"
          />
        </div>
      </div>
      <div className={styles.eventMatchBodyQuickInfo}>
        <img
          src={event.eventCoverPhoto}
          className={styles.eventCardCover}
          alt={`event cover - ${event.eventName}`}
        />
        <div className={styles.eventCardSection}>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/hourglassIcon.svg"
              variant="small"
              altText="Event Duration Icon"
            />
            <Typography variant="text" textToDisplay={eventDuration} />
          </div>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/calendarIcon.svg"
              variant="small"
              altText="Event Date Icon"
            />
            <Typography variant="text" textToDisplay={formattedDate} />
          </div>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/clockIcon.svg"
              variant="small"
              altText="Event Time Icon"
            />
            <Typography variant="text" textToDisplay={formattedStartTime} />
          </div>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/whyVolunteerIcon.svg"
              variant="small"
              altText="Event Location Icon"
            />
            <Typography variant="text" textToDisplay={signedUpVolunteers} />
          </div>
        </div>
      </div>
      <div className={styles.eventMatchBodyDescription}>
        <Typography variant="header" textToDisplay={event.eventName} />
        <Typography variant="locationSmall" textToDisplay={locationText} />
        <Typography variant="text" textToDisplay={event.eventDescription} />
        <div>
          <Typography
            variant="sectionTitle"
            textToDisplay="Volunteer Impact:"
          />
          <Typography variant="text" textToDisplay={eventImpactText} />
        </div>
      </div>
      {isSignedUp && (
        <Typography
          variant="text"
          textToDisplay="You are signed up for this event."
        />
      )}
      {!isEventPoster && !isSignedUp && !impactView && (
        <div className={styles.eventMatchFooter}>
          <DarbeButton
            buttonText="Pass"
            onClick={handlePassEvent}
            darbeButtonType="secondaryNextButton"
          />
          <DarbeButton
            buttonText="Volunteer"
            onClick={handleVolunteerEvent}
            darbeButtonType="nextButton"
          />
        </div>
      )}
    </div>
  );
};
