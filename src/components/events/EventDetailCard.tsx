import { useState } from "react";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { selectUser } from "../../features/users/selectors";
import {
  CreateEvent,
  EventsState,
} from "../../services/api/endpoints/types/events.api.types";
import { useAppSelector } from "../../services/hooks";
import { CheckBox } from "../checkbox/Checkbox";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { Typography } from "../typography/Typography";
import { formatDarbeTimeToString } from "../../utils/CommonFunctions";
import { UserAvatars } from "../avatars/UserAvatars";
import { useGetSimpleUserInfoQuery } from "../../services/api/endpoints/profiles/profiles.api";

import styles from "./styles/eventCards.module.css";

interface EventDetailCardProps {
  event?: EventsState;
  previewEventData?: CreateEvent;
  isPreview?: boolean;
  isEventOwner?: boolean;
}
// TODO: Clean up, we use this for created events and for previewing a posted event
export const EventDetailCard = ({
  event = undefined,
  previewEventData = undefined,
  isPreview = false,
  isEventOwner = false,
}: EventDetailCardProps) => {
  const navigate = useNavigate();
  const { user } = useAppSelector(selectUser);
  const [userAgreesToWaiver, setUseAgreesToWaiver] = useState({
    adultWaiver: false,
    minorWaiver: false,
  });
  const eventCoordinatorId = isPreview
    ? previewEventData?.eventCoordinator
    : event?.eventCoordinator.id;
  console.log("event ", event);
  const { data: eventCoordinatorData } =
    useGetSimpleUserInfoQuery(eventCoordinatorId);
  // TODO: Remove these when they are used
  console.log(isEventOwner);
  console.log(userAgreesToWaiver);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUseAgreesToWaiver((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  // TODO: These two might be redundant
  const nameToUse =
    user?.userType === "organization" ? "organizationName" : "nonprofitName";
  const eventOwnerName = isPreview
    ? user?.[nameToUse]
    : event?.eventOwner?.[nameToUse];
  // end of TODO
  console.log("the event owner name", eventCoordinatorData);

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
  const formattedDate = eventDateToUse
    ? new Date(eventDateToUse.toString()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "?";
  const formattedStartTime = formatDarbeTimeToString(eventStartTimeToUse);
  const signedUpVolunteers = isPreview
    ? `0/${event?.maxVolunteerCount} Volunteers`
    : `${event?.signups?.length}/${event?.maxVolunteerCount} Volunteers`;
  const individualImpactPerHouToUse = isPreview
    ? previewEventData?.volunteerImpact?.individualImpactPerHour
    : event?.volunteerImpact?.individualImpactPerHour;
  const groupImpactPerHouToUser = isPreview
    ? previewEventData?.volunteerImpact?.groupImpactPerHour
    : event?.volunteerImpact?.groupImpactPerHour;
  const invidualImpactToUse = isPreview
    ? previewEventData?.volunteerImpact?.individualImpact
    : event?.volunteerImpact?.individualImpact;
  const groupImpactToUse = isPreview
    ? previewEventData?.volunteerImpact?.groupImpact
    : event?.volunteerImpact?.groupImpact;
  const hasIndividualImpact = isPreview
    ? previewEventData?.volunteerImpact?.isIndividualImpact
    : event?.volunteerImpact?.isIndividualImpact;
  const volunteerImpact = hasIndividualImpact
    ? `${individualImpactPerHouToUse} ${invidualImpactToUse} `
    : `${groupImpactPerHouToUser} ${groupImpactToUse}`;
  const eventNameToUse = isPreview
    ? previewEventData?.eventName
    : event?.eventName;
  const eventCoverPhotoToUse = isPreview
    ? previewEventData?.eventCoverPhoto
    : event?.eventCoverPhoto;
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

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventCardHeader}>
        <div className={styles.eventCardGoBack}>
          <IconButton onClick={handleGoBack}>
            <CustomSvgs
              svgPath="/svgs/common/goBackIcon.svg"
              altText="Go back"
            />
          </IconButton>
          <UserAvatars profilePicture={eventOwnerProfilePicture} />
          <Typography variant="blueTextNormal" textToDisplay={eventOwnerName} />
        </div>
      </div>
      <div className={styles.eventCardDetails}>
        <Typography variant="nameHeader" textToDisplay={eventNameToUse} />
        <img
          src={eventCoverPhotoToUse ?? ""}
          alt="Event cover"
          className={styles.eventCardDetailsPhoto}
        />
        <div className={styles.eventCardKeyDetails}>
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

          <div className={styles.eventCardSection}>
            <Typography variant="sectionTitle" textToDisplay="Description" />
            <Typography variant="text" textToDisplay={eventDescriptionToUse} />
          </div>

          <div className={styles.eventCardSection}>
            <div className={styles.eventCardRowInfo}>
              <Typography
                variant="sectionTitle"
                textToDisplay="Volunteer Impact"
              />
              <Typography variant="text" textToDisplay={volunteerImpact} />
            </div>
          </div>

          <div className={styles.eventCardSection}>
            <Typography variant="sectionTitle" textToDisplay="Location" />
            <Typography variant="text" textToDisplay={eventLocationNameToUse} />
            <Typography variant="text" textToDisplay={eventStreetNameToUse} />
            <Typography variant="text" textToDisplay={eventCityToUse} />
          </div>

          <div className={styles.eventCardSection}>
            <Typography variant="sectionTitle" textToDisplay="Parking Detail" />
            <Typography variant="text" textToDisplay={eventParkingToUse} />
            <Typography
              variant="text"
              textToDisplay={eventInternalLocationToUse}
            />
          </div>

          <div className={styles.eventCardSection}>
            <Typography variant="sectionTitle" textToDisplay="Requirements" />
            <Typography variant="text" textToDisplay={eventSuppliesToUse} />
            <Typography
              variant="sectionTitle"
              textToDisplay="Age Restrictions"
            />
            <Typography
              variant="text"
              textToDisplay={eventAgeRestrictionsToUse}
            />
            <div className={styles.eventCardRowInfo}>
              <Typography
                variant="sectionTitle"
                textToDisplay="Lift Requirements"
              />
              <Typography
                variant="text"
                textToDisplay={eventLiftRequirementsToUse}
              />
            </div>
          </div>

          <div className={styles.eventCardSection}>
            <Typography variant="sectionTitle" textToDisplay="Attire" />
            <Typography variant="text" textToDisplay={eventAttireToUse} />
          </div>

          <div className={styles.eventCardSection}>
            <div className={styles.eventCardRowInfo}>
              <Typography
                variant="sectionTitle"
                textToDisplay="Event Coordinator:"
              />
              <UserAvatars
                profilePicture={eventCoordinatorProfilePicture}
                fullName={eventCoordinatorName}
              />
            </div>
          </div>

          <div className={styles.eventCardSection}>
            <div className={styles.eventCardRowInfo}>
              <CheckBox
                disabled={!!isPreview}
                label="I Agree to the terms of this Adult Waiver"
                labelPlacement="right"
                name="adultWaiver"
                onChange={handleCheckboxChange}
              />
            </div>
            <div className={styles.eventCardRowInfo}>
              <CheckBox
                disabled={!!isPreview}
                onChange={handleCheckboxChange}
                label="I Agree to the terms of this Minor Waiver"
                name="minorWaiver"
                labelPlacement="right"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
