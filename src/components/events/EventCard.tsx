import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { useState } from "react";

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
import {
  selectCurrentUserId,
  selectUserType,
} from "../../features/users/selectors";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/eventCards.module.css";
import {
  usePassOnEventMutation,
  useUnvolunteerFromEventMutation,
  useVolunteerForEventMutation,
} from "../../services/api/endpoints/events/events.api";

interface EventCardProps {
  event: ShortEventState;
  isSignedUp?: boolean;
  signupCount?: number;
  impactView?: boolean;
  onUnvolunteerSuccess?: (eventId: string) => void;
  canUnvolunteer?: boolean;
  hideVolunteerActions?: boolean;
  hideDetailsAction?: boolean;
  returnToEventsTab?: string;
  canExpandVolunteers?: boolean;
  variant?: "default" | "match";
  incompleteActionLabel?: string;
  onIncompleteAction?: (eventId: string) => void;
}

export const EventCard = ({
  event,
  isSignedUp,
  signupCount = 0,
  impactView = false,
  onUnvolunteerSuccess,
  canUnvolunteer = true,
  hideVolunteerActions = false,
  hideDetailsAction = false,
  returnToEventsTab,
  canExpandVolunteers = false,
  variant = "default",
  incompleteActionLabel,
  onIncompleteAction,
}: EventCardProps) => {
  const navigate = useNavigate();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const currentUserType = useAppSelector(selectUserType);
  const [passOnEvent, { isLoading: isPassing }] = usePassOnEventMutation();
  const [unvolunteerFromEvent, { isLoading: isUnvolunteering }] =
    useUnvolunteerFromEventMutation();
  const [volunteerForEvent, { isLoading: isVolunteering }] =
    useVolunteerForEventMutation();
  const [hasVolunteered, setHasVolunteered] = useState(Boolean(isSignedUp));
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [showPassConfirmDialog, setShowPassConfirmDialog] = useState(false);
  const [showPassRejectedDialog, setShowPassRejectedDialog] = useState(false);
  const [isVolunteerListOpen, setIsVolunteerListOpen] = useState(false);

  const handleAvatarClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  const handlePassEvent = () => {
    setShowPassConfirmDialog(true);
  };

  const handleConfirmPassEvent = async () => {
    try {
      await passOnEvent(event.id).unwrap();
      setShowPassConfirmDialog(false);
      setShowPassRejectedDialog(true);
      setTimeout(() => setShowPassRejectedDialog(false), 1400);
    } catch (error) {
      console.error("Error passing on event", error);
    }
  };

  const handleVolunteerEvent = async () => {
    const eventId = event.id;

    try {
      await volunteerForEvent(eventId).unwrap();
      setHasVolunteered(true);
      setShowVolunteerDialog(true);
      setTimeout(() => setShowVolunteerDialog(false), 1400);
    } catch (error) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message ??
        "Unable to volunteer for this event right now.";

      if (errorMessage.includes("already volunteered")) {
        setHasVolunteered(true);
      } else {
        console.error("Error volunteering for event", error);
      }
    }
  };

  const handleUnvolunteerEvent = async () => {
    try {
      await unvolunteerFromEvent(event.id).unwrap();
      setHasVolunteered(false);
      onUnvolunteerSuccess?.(event.id);
    } catch (error) {
      console.error("Error unvolunteering from event", error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventShareUrl);
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
  const eventDate = new Date(event.eventDate);
  const compactDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const calculatedEventDuration = event.endTime
    ? event.endTime - event.startTime
    : undefined;
  const formattedStartTime = formatDarbeTimeToString(event.startTime);
  const signupValueToUse =
    signupCount > 0 ? signupCount : event.signups?.length || 0;
  const signedUpVolunteers = `${signupValueToUse}/${event.maxVolunteerCount} ${
    variant === "match" ? "Volunteers" : "Signed Up"
  }`;
  const isEventPoster = currentUserId === event.eventOwner.id;
  const isVolunteerLocked = hasVolunteered || isVolunteering;
  const isSignedUpCard = Boolean(isSignedUp);
  const canSelectVolunteers = currentUserType === "nonprofit";
  const checkedInVolunteerCount =
    event.signups?.filter((signup) => signup.status === "confirmed").length ?? 0;

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
    navigate(`${EVENTS_ROUTE}/${event.id}`, {
      state: returnToEventsTab ? { returnToEventsTab } : undefined,
    });
  };

  const eventImpactText = calculateEventImpact();
  const isMatchVariant = variant === "match";
  const eventShareUrl = `${window.location.origin}/home/events/${event.id}`;
  const eventCardClassName = `${styles.eventMatchPreview} ${
    isMatchVariant ? styles.eventMatchPreviewCard : ""
  }`;
  const eventDateToDisplay = isMatchVariant ? compactDate : formattedDate;
  const eventCoverPhoto =
    event.eventCoverPhoto || assetUrl("/images/defaultCoverPhoto.jpg");

  return (
    <div className={eventCardClassName}>
      <div className={styles.eventMatchHeader}>
        <div className={styles.eventMatchHeaderUserInfo}>
          <UserAvatars
            profilePicture={event.eventOwner.profilePicture}
            onClick={() => handleAvatarClick(event.eventOwner.id)}
          />
          <Typography
            variant="blueTextNormal"
            textToDisplay={displayName}
            onClick={() => handleAvatarClick(event.eventOwner.id)}
            extraClass="clickable"
          />
        </div>
        <div className={styles.eventMatchHeaderDetails}>
          {!isMatchVariant && (
            <IconButton onClick={handleCopyLink}>
              <ContentCopy />
            </IconButton>
          )}
          {!hideDetailsAction && (
            <Typography
              variant="blueTextNormal"
              textToDisplay={"Details"}
              onClick={handleDetailsClick}
              extraClass="clickable"
            />
          )}
        </div>
      </div>
      <div className={styles.eventMatchBodyQuickInfo}>
        <img
          src={eventCoverPhoto}
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
            <Typography variant="text" textToDisplay={eventDateToDisplay} />
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

      {!impactView && (
        <div className={styles.eventMatchFooter}>
          <button
            type="button"
            className={styles.eventSeeVolunteersButton}
            onClick={() => {
              if (canExpandVolunteers) {
                setIsVolunteerListOpen((isOpen) => !isOpen);
                return;
              }

              handleDetailsClick();
            }}
            aria-expanded={canExpandVolunteers ? isVolunteerListOpen : undefined}
          >
            See Volunteers
            <CustomSvgs
              svgPath={
                canExpandVolunteers && isVolunteerListOpen
                  ? "/svgs/common/goUpIcon.svg"
                  : "/svgs/common/goForwardIcon.svg"
              }
              variant="small"
              altText=""
            />
          </button>
          {!isEventPoster && !hideVolunteerActions && (
            <div className={styles.eventMatchActions}>
              {!hasVolunteered && !isSignedUpCard && (
                <DarbeButton
                  buttonText="Pass"
                  onClick={handlePassEvent}
                  darbeButtonType="secondaryNextButton"
                  isDisabled={isPassing}
                />
              )}
              {isSignedUpCard && canUnvolunteer ? (
                <DarbeButton
                  buttonText="Unvolunteer"
                  onClick={handleUnvolunteerEvent}
                  darbeButtonType="secondaryNextButton"
                  isDisabled={isUnvolunteering}
                />
              ) : !isSignedUpCard ? (
                <DarbeButton
                  buttonText={
                    hasVolunteered ? "Volunteered" : "Volunteer"
                  }
                  onClick={handleVolunteerEvent}
                  darbeButtonType="nextButton"
                  isDisabled={isVolunteerLocked}
                />
              ) : null}
            </div>
          )}
          {incompleteActionLabel && onIncompleteAction && (
            <div className={styles.eventMatchActions}>
              <DarbeButton
                buttonText={incompleteActionLabel}
                onClick={() => onIncompleteAction(event.id)}
                darbeButtonType="nextButton"
              />
            </div>
          )}
        </div>
      )}
      {canExpandVolunteers && isVolunteerListOpen && (
        <div className={styles.eventVolunteerList}>
          {event.signups?.map((signup) => {
            const volunteerName =
              signup.user.fullName ||
              `${signup.user.firstName ?? ""} ${signup.user.lastName ?? ""}`.trim();
            const isCurrentVolunteer = signup.user.id === currentUserId;
            const isCheckedIn = signup.status === "confirmed";

            return (
              <div className={styles.eventVolunteerRow} key={signup.id}>
                <div className={styles.eventVolunteerInfo}>
                  <button
                    type="button"
                    className={styles.eventVolunteerAvatarButton}
                    onClick={() => handleAvatarClick(signup.user.id)}
                    aria-label={`Open ${volunteerName} profile`}
                  >
                    <img
                      className={styles.eventVolunteerAvatar}
                      src={
                        signup.user.profilePicture ||
                        assetUrl("/images/defaultProfilePicture.jpg")
                      }
                      alt=""
                    />
                  </button>
                  <div className={styles.eventVolunteerText}>
                    <button
                      type="button"
                      onClick={() => handleAvatarClick(signup.user.id)}
                    >
                      {volunteerName}
                    </button>
                    {signup.user.jobTitle && <span>{signup.user.jobTitle}</span>}
                  </div>
                </div>
                {isCurrentVolunteer && (
                  <div className={styles.eventVolunteerCheckIn}>
                    <strong>{isCheckedIn ? "Checked In" : "Not Checked In"}</strong>
                    {!isCheckedIn && (
                      <button
                        type="button"
                        className={styles.eventVolunteerCheckInButton}
                        onClick={handleVolunteerEvent}
                        disabled={isVolunteerLocked}
                      >
                        Check In
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className={styles.eventVolunteerListFooter}>
            <strong>
              Check in status: {checkedInVolunteerCount}/{event.maxVolunteerCount}{" "}
              Volunteers Checked in
            </strong>
            {canSelectVolunteers && (
              <button type="button">
                Select Volunteers
                <CustomSvgs
                  svgPath="/svgs/common/goDownIcon.svg"
                  variant="small"
                  altText=""
                />
              </button>
            )}
          </div>
        </div>
      )}
      {showVolunteerDialog ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventVolunteerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`volunteer-dialog-title-${event.id}`}
          >
            <h2
              className={styles.eventVolunteerDialogTitle}
              id={`volunteer-dialog-title-${event.id}`}
            >
              <span
                className={styles.eventVolunteerDialogIcon}
                aria-hidden="true"
              />
              <span>Event Accepted</span>
            </h2>
          </div>
        </div>
      ) : null}
      {showPassConfirmDialog ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventPassConfirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`pass-dialog-title-${event.id}`}
          >
            <h2
              className={styles.eventPassConfirmTitle}
              id={`pass-dialog-title-${event.id}`}
            >
              Are you sure you want to Pass?
            </h2>
            <div className={styles.eventPassConfirmActions}>
              <button
                type="button"
                className={styles.eventPassYesButton}
                onClick={handleConfirmPassEvent}
                disabled={isPassing}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.eventPassCancelButton}
                onClick={() => setShowPassConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showPassRejectedDialog ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div className={styles.eventVolunteerDialog} role="status">
            <h2 className={styles.eventVolunteerDialogTitle}>
              <span
                className={styles.eventVolunteerDialogIcon}
                aria-hidden="true"
              />
              <span>Event Rejected</span>
            </h2>
          </div>
        </div>
      ) : null}
    </div>
  );
};
