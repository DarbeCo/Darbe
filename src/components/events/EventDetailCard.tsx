import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { selectUser } from "../../features/users/selectors";
import {
  CreateEvent,
  EventsState,
} from "../../services/api/endpoints/types/events.api.types";
import {
  usePassOnEventMutation,
  useVolunteerForEventMutation,
} from "../../services/api/endpoints/events/events.api";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import {
  formatDarbeTimeToString,
  getUserStateFromZip,
} from "../../utils/CommonFunctions";
import { UserAvatars } from "../avatars/UserAvatars";
import { useGetSimpleUserInfoQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { NEW_MESSAGE_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import { assetUrl } from "../../utils/assetUrl";
import {
  MODAL_TYPE,
  setExternalData,
  setModalType,
  showModal,
} from "../modal/modalSlice";

import styles from "./styles/eventCards.module.css";

interface EventDetailCardProps {
  event?: EventsState;
  eventId?: string;
  previewEventData?: CreateEvent;
  isPreview?: boolean;
  isEventOwner?: boolean;
}

interface DetailMetricProps {
  icon: string;
  label: string;
  alt: string;
}

const DetailMetric = ({ icon, label, alt }: DetailMetricProps) => (
  <div className={styles.eventDetailMetric}>
    <CustomSvgs svgPath={icon} variant="small" altText={alt} />
    <span>{label}</span>
  </div>
);

export const EventDetailCard = ({
  event = undefined,
  eventId = undefined,
  previewEventData = undefined,
  isPreview = false,
  isEventOwner = false,
}: EventDetailCardProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectUser);
  const [passOnEvent, { isLoading: isPassing }] = usePassOnEventMutation();
  const [volunteerForEvent, { isLoading: isVolunteering }] =
    useVolunteerForEventMutation();
  const [userAgreesToWaiver, setUserAgreesToWaiver] = useState({
    adultWaiver: false,
    minorWaiver: false,
  });
  const [hasVolunteered, setHasVolunteered] = useState(false);
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [showPassConfirmDialog, setShowPassConfirmDialog] = useState(false);
  const [showPassRejectedDialog, setShowPassRejectedDialog] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const eventCoordinatorId = isPreview
    ? previewEventData?.eventCoordinator
    : event?.eventCoordinator.id;
  const { data: eventCoordinatorData } =
    useGetSimpleUserInfoQuery(eventCoordinatorId);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserAgreesToWaiver((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const eventOwnerName = isPreview
    ? user?.userType === "organization"
      ? user?.organizationName
      : user?.nonprofitName
    : event?.eventOwner?.userType === "organization"
      ? event?.eventOwner?.organizationName
      : event?.eventOwner?.nonprofitName;
  const eventCoordinatorName =
    eventCoordinatorData?.fullName ||
    eventCoordinatorData?.organizationName ||
    eventCoordinatorData?.nonprofitName;
  const eventEndtimeToUse = isPreview
    ? previewEventData?.endTime
    : event?.endTime;
  const eventStartTimeToUse = isPreview
    ? previewEventData?.startTime
    : event?.startTime;
  const eventDateToUse = isPreview
    ? previewEventData?.eventDate
    : event?.eventDate;
  const hasEndTime = isPreview
    ? !!previewEventData?.endTime
    : !!eventEndtimeToUse;
  const eventDuration =
    hasEndTime && eventEndtimeToUse && eventStartTimeToUse
      ? `${eventEndtimeToUse - eventStartTimeToUse} Hours`
      : "? Hours";
  const compactDate = eventDateToUse
    ? new Date(eventDateToUse.toString()).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "?";
  const formattedStartTime = formatDarbeTimeToString(eventStartTimeToUse);
  const signupCount = event?.signups?.length ?? 0;
  const maxVolunteerCount = isPreview
    ? previewEventData?.maxVolunteerCount ?? 0
    : event?.maxVolunteerCount ?? 0;
  const signedUpVolunteers = `${signupCount}/${maxVolunteerCount} Volunteers`;
  const individualImpactPerHourToUse = isPreview
    ? previewEventData?.volunteerImpact?.individualImpactPerHour
    : event?.volunteerImpact?.individualImpactPerHour;
  const groupImpactPerHourToUse = isPreview
    ? previewEventData?.volunteerImpact?.groupImpactPerHour
    : event?.volunteerImpact?.groupImpactPerHour;
  const individualImpactToUse = isPreview
    ? previewEventData?.volunteerImpact?.individualImpact
    : event?.volunteerImpact?.individualImpact;
  const groupImpactToUse = isPreview
    ? previewEventData?.volunteerImpact?.groupImpact
    : event?.volunteerImpact?.groupImpact;
  const hasIndividualImpact = isPreview
    ? previewEventData?.volunteerImpact?.isIndividualImpact
    : event?.volunteerImpact?.isIndividualImpact;
  const volunteerImpact = hasIndividualImpact
    ? `${individualImpactPerHourToUse ?? ""} ${individualImpactToUse ?? ""}`.trim()
    : `${groupImpactPerHourToUse ?? ""} ${groupImpactToUse ?? ""}`.trim();
  const eventNameToUse = isPreview
    ? previewEventData?.eventName
    : event?.eventName;
  const eventCoverPhotoToUse =
    (isPreview ? previewEventData?.eventCoverPhoto : event?.eventCoverPhoto) ||
    assetUrl("/images/defaultCoverPhoto.jpg");
  const eventDescriptionToUse = isPreview
    ? previewEventData?.eventDescription
    : event?.eventDescription;
  const eventLocationNameToUse = isPreview
    ? previewEventData?.eventAddress?.locationName
    : event?.eventAddress?.locationName;
  const eventStreetNameToUse = isPreview
    ? previewEventData?.eventAddress?.streetName
    : event?.eventAddress?.streetName;
  const eventCityToUse = isPreview
    ? previewEventData?.eventAddress?.city
    : event?.eventAddress?.city;
  const eventZipToUse = isPreview
    ? previewEventData?.eventAddress?.zipCode
    : event?.eventAddress?.zipCode;
  const eventStateToUse = eventZipToUse
    ? getUserStateFromZip(eventZipToUse)?.st
    : undefined;
  const cityStateZip = [
    [eventCityToUse, eventStateToUse].filter(Boolean).join(", "),
    eventZipToUse,
  ]
    .filter(Boolean)
    .join(" ");
  const eventParkingToUse = isPreview
    ? previewEventData?.eventParkingInfo
    : event?.eventParkingInfo;
  const eventInternalLocationToUse = isPreview
    ? previewEventData?.eventInternalLocation
    : event?.eventInternalLocation;
  const eventSuppliesToUse = isPreview
    ? previewEventData?.eventRequirements?.supplies
    : event?.eventRequirements?.supplies;
  const eventAgeRestrictionsToUse = isPreview
    ? previewEventData?.eventRequirements?.ageRestrictions
    : event?.eventRequirements?.ageRestrictions;
  const eventLiftRequirementsToUse = isPreview
    ? previewEventData?.eventRequirements?.liftRequirements
    : event?.eventRequirements?.liftRequirements;
  const eventAttireToUse = isPreview
    ? previewEventData?.eventRequirements?.attire
    : event?.eventRequirements?.attire;
  const eventOwnerProfilePicture = isPreview
    ? user?.profilePicture
    : event?.eventOwner?.profilePicture;
  const eventCoordinatorProfilePicture = eventCoordinatorData?.profilePicture;
  const eventShareUrl = eventId
    ? `${window.location.origin}/home/events/${eventId}`
    : "";

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleOwnerProfileClick = () => {
    if (!isPreview && event?.eventOwner?.id) {
      navigate(`${PROFILE_ROUTE}/${event.eventOwner.id}`);
    }
  };

  const handleCoordinatorProfileClick = () => {
    if (eventCoordinatorId) {
      navigate(`${PROFILE_ROUTE}/${eventCoordinatorId}`);
    }
  };

  const handleShare = () => {
    if (eventShareUrl) {
      navigator.clipboard.writeText(eventShareUrl);
    }
    setIsShareMenuOpen(false);
  };

  const handleShareToNewsFeed = () => {
    dispatch(setExternalData(eventShareUrl));
    dispatch(setModalType(MODAL_TYPE.createPost));
    dispatch(showModal());
    setIsShareMenuOpen(false);
  };

  const handleShareWithFriend = () => {
    if (user?.id) {
      navigate(NEW_MESSAGE_ROUTE(user.id), {
        state: eventShareUrl ? { shareUrl: eventShareUrl } : undefined,
      });
    }
    setIsShareMenuOpen(false);
  };

  const handlePassEvent = () => {
    setShowPassConfirmDialog(true);
  };

  const handleConfirmPassEvent = async () => {
    if (!eventId) return;

    try {
      await passOnEvent(eventId).unwrap();
      setShowPassConfirmDialog(false);
      setShowPassRejectedDialog(true);
      setTimeout(() => setShowPassRejectedDialog(false), 1400);
    } catch (error) {
      console.error("Error passing on event", error);
    }
  };

  const handleVolunteerEvent = async () => {
    if (!eventId) return;

    try {
      await volunteerForEvent(eventId).unwrap();
      setHasVolunteered(true);
      setShowVolunteerDialog(true);
      setTimeout(() => setShowVolunteerDialog(false), 1400);
    } catch (error) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message ?? "";

      if (errorMessage.includes("already volunteered")) {
        setHasVolunteered(true);
      } else {
        console.error("Error volunteering for event", error);
      }
    }
  };

  return (
    <div className={styles.eventDetailPage}>
      <div className={styles.eventDetailHeroCard}>
        <div className={styles.eventDetailHeader}>
          <button
            type="button"
            className={styles.eventDetailOwner}
            onClick={handleOwnerProfileClick}
          >
            <UserAvatars profilePicture={eventOwnerProfilePicture} />
            <span>{eventOwnerName}</span>
          </button>
          <div className={styles.eventDetailHeaderActions}>
            <div className={styles.eventShareMenuWrap}>
              <button
                type="button"
                onClick={() => setIsShareMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isShareMenuOpen}
              >
                Share
              </button>
              {isShareMenuOpen && (
                <div className={styles.eventShareMenu}>
                  <button type="button" onClick={handleShareToNewsFeed}>
                    <CustomSvgs
                      svgPath="/svgs/common/addShareIcon.svg"
                      variant="small"
                      altText=""
                    />
                    Share to News Feed
                  </button>
                  <button type="button" onClick={handleShareWithFriend}>
                    <CustomSvgs
                      svgPath="/svgs/common/addShareIcon.svg"
                      variant="small"
                      altText=""
                    />
                    Share with Friend
                  </button>
                  <button type="button" onClick={handleShare}>
                    <CustomSvgs
                      svgPath="/svgs/common/copyLinkIcon.svg"
                      variant="small"
                      altText=""
                    />
                    Copy Link
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.eventDetailCloseButton}
              onClick={handleGoBack}
              aria-label="Close event details"
            >
              x
            </button>
          </div>
        </div>

        <div className={styles.eventDetailHeroBody}>
          <h1>{eventNameToUse}</h1>
          <div className={styles.eventDetailHeroGrid}>
            <img
              src={eventCoverPhotoToUse}
              alt={`Event cover - ${eventNameToUse}`}
              className={styles.eventDetailPhoto}
            />
            <div className={styles.eventDetailMetrics}>
              <DetailMetric
                icon="/svgs/common/hourglassIcon.svg"
                label={eventDuration}
                alt="Event duration"
              />
              <DetailMetric
                icon="/svgs/common/whyVolunteerIcon.svg"
                label={signedUpVolunteers}
                alt="Volunteer count"
              />
              <DetailMetric
                icon="/svgs/common/calendarIcon.svg"
                label={compactDate}
                alt="Event date"
              />
              <DetailMetric
                icon="/svgs/common/clockIcon.svg"
                label={formattedStartTime}
                alt="Event time"
              />
            </div>
          </div>
        </div>
      </div>

      <section className={styles.eventDetailSection}>
        <h2>Description</h2>
        <p>{eventDescriptionToUse}</p>
      </section>

      <section className={styles.eventDetailImpact}>
        <strong>Volunteer Impact :</strong>
        <span>{volunteerImpact || "None"}</span>
      </section>

      <div className={styles.eventDetailTwoColumn}>
        <section className={styles.eventDetailSection}>
          <h2>Location</h2>
          <p>{eventLocationNameToUse}</p>
          <p className={styles.eventDetailBlueText}>{eventStreetNameToUse}</p>
          <p className={styles.eventDetailBlueText}>{cityStateZip}</p>
          <p className={styles.eventDetailSmallBlock}>
            <strong>Assignment Location:</strong>
            <span>{eventInternalLocationToUse || "None"}</span>
          </p>
        </section>

        <section className={styles.eventDetailSection}>
          <h2>Parking Detail</h2>
          <p>{eventParkingToUse || "None"}</p>
          {eventInternalLocationToUse && (
            <p className={styles.eventDetailBoldText}>
              {eventInternalLocationToUse}
            </p>
          )}
        </section>
      </div>

      <div className={styles.eventDetailTwoColumn}>
        <section className={styles.eventDetailSection}>
          <div>
            <h2>Requirements</h2>
            <p>{eventSuppliesToUse || "None"}</p>
          </div>
          
          {eventAgeRestrictionsToUse && <p>{eventAgeRestrictionsToUse}</p>}
          <div className={styles.eventLiftRequirementHeader}>
            <h2>Lift Requirements</h2>
            <p>{eventLiftRequirementsToUse || "None"}</p>
          </div>
        </section>

        <section className={styles.eventDetailSection}>
          <h2>Attire</h2>
          <p>{eventAttireToUse || "None"}</p>
        </section>
      </div>

      <section className={styles.eventDetailCoordinator}>
        <strong>Event Coordinator:</strong>
        <button type="button" onClick={handleCoordinatorProfileClick}>
          <UserAvatars
            profilePicture={eventCoordinatorProfilePicture}
            fullName={eventCoordinatorName}
          />
        </button>
      </section>

      <section className={styles.eventDetailWaivers}>
        <label>
          <input
            type="checkbox"
            name="adultWaiver"
            checked={userAgreesToWaiver.adultWaiver}
            disabled={!!isPreview}
            onChange={handleCheckboxChange}
          />
          Adult waiver
        </label>
        <label>
          <input
            type="checkbox"
            name="minorWaiver"
            checked={userAgreesToWaiver.minorWaiver}
            disabled={!!isPreview}
            onChange={handleCheckboxChange}
          />
          Minor waiver
        </label>
      </section>

      {!isEventOwner && !isPreview && (
        <div className={styles.eventDetailActions}>
          <button
            type="button"
            className={styles.eventDetailSecondaryButton}
            onClick={handlePassEvent}
            disabled={isPassing}
          >
            Pass
          </button>
          <button
            type="button"
            className={styles.eventDetailPrimaryButton}
            onClick={handleVolunteerEvent}
            disabled={hasVolunteered || isVolunteering}
          >
            {hasVolunteered ? "Volunteered" : "Volunteer"}
          </button>
        </div>
      )}
      {showVolunteerDialog && (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventVolunteerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="volunteer-dialog-title-detail"
          >
            <h2
              className={styles.eventVolunteerDialogTitle}
              id="volunteer-dialog-title-detail"
            >
              <span
                className={styles.eventVolunteerDialogIcon}
                aria-hidden="true"
              />
              <span>Event Accepted</span>
            </h2>
          </div>
        </div>
      )}
      {showPassConfirmDialog && (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventPassConfirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pass-dialog-title-detail"
          >
            <h2
              className={styles.eventPassConfirmTitle}
              id="pass-dialog-title-detail"
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
      )}
      {showPassRejectedDialog && (
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
      )}
    </div>
  );
};
