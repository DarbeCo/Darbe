import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";

import { DarbeButton } from "../../components/buttons/DarbeButton";
import { CreateEvent } from "../../services/api/endpoints/types/events.api.types";
import { FormSteps } from "../../components/formSteps/FormSteps";
import { useCreateEventMutation } from "../../services/api/endpoints/events/events.api";
import { useAppSelector } from "../../services/hooks";
import { EVENTS_ROUTE, HOME_ROUTE } from "../../routes/route.constants";
import { selectCurrentUserId } from "../users/selectors";
import { EventDetails } from "./forms/EventDetails";
import { EventInfo } from "./forms/EventInfo";
import { EventLocation } from "./forms/EventLocation";
import { EventRequirements } from "./forms/EventRequirements";
import { EventType } from "./EventType";
import { InternalEventReview } from "./InternalEventReview";
import { ClosingIcon } from "../../components/closingIcon/ClosingIcon";
import { Typography } from "../../components/typography/Typography";
import { CustomSvgs } from "../../components/customSvgs/CustomSvgs";

import styles from "./styles/postNeed.module.css";

// TODO: Copy signup and error validations from signup form
const INITIAL_EVENT_STATE: CreateEvent = {
  eventName: "",
  eventDescription: "",
  eventDate: "",
  startTime: 0,
  endTime: 0,
  eventHoursNeeded: "",
  isRepeating: false,
  isFollowersOnly: false,
  maxVolunteerCount: 0,
  eventAddress: {
    locationName: "",
    streetName: "",
    city: "",
    zipCode: "",
  },
  eventParkingInfo: "",
  eventInternalLocation: "",
  isIndoor: false,
  isOutdoor: false,
  eventRequirements: {
    supplies: "",
    ageRestrictions: "",
    attire: "",
    liftRequirements: "",
  },
  eventOwner: "",
  eventCoordinator: "",
  volunteerImpact: {
    individualImpact: "",
    individualImpactPerHour: "",
    groupImpact: "",
    groupImpactPerHour: "",
    isIndividualImpact: false,
    isGroupImpact: false,
  },
  adultWaiver: "",
  minorWaiver: "",
};

const toDatabaseDate = (date: CreateEvent["eventDate"]) => {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }

  if (typeof date !== "string") {
    return "";
  }

  const mmDdYyyyMatch = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (mmDdYyyyMatch) {
    const [, month, day, year] = mmDdYyyyMatch;
    return `${year}-${month}-${day}`;
  }

  return date.split("T")[0];
};

const toNumber = (value: number | string | undefined, fallback = 0) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const hasValue = (value?: unknown) => Boolean(value?.toString().trim());

export const PostNeed = () => {
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const [currentStep, setCurrentStep] = useState(-1);
  const [eventType, setEventType] = useState("");
  const [eventData, setEventData] = useState<CreateEvent>(INITIAL_EVENT_STATE);
  const [submitValidationDialog, setSubmitValidationDialog] = useState<{
    missingFields: string[];
    nextStep: number;
  } | null>(null);
  const [createEvent] = useCreateEventMutation();

  const handlePostEvent = async () => {
    const invalidStep = getInvalidStep();

    if (invalidStep) {
      setSubmitValidationDialog(invalidStep);
      return;
    }

    try {
      const isInternalEvent = eventType === "internalEvent";
      // build the payload with the current userId
      const payload: CreateEvent = {
        ...eventData,
        eventDate: toDatabaseDate(eventData.eventDate),
        startTime: toNumber(eventData.startTime),
        endTime: toNumber(eventData.endTime),
        maxVolunteerCount:
          isInternalEvent && !toNumber(eventData.maxVolunteerCount)
            ? 15
            : toNumber(eventData.maxVolunteerCount),
        isFollowersOnly: isInternalEvent || Boolean(eventData.isFollowersOnly),
        // set the event owner to the current user
        eventOwner: userId,
      };

      await createEvent(payload).unwrap();
      setSubmitValidationDialog(null);
      navigate(EVENTS_ROUTE);
    } catch (error) {
      console.error("Error posting event", error);
    }
  };

  const handleExit = () => {
    navigate(HOME_ROUTE);
  };

  const handleEventSelection = (selectedEventType: string) => {
    const isChangingEventType =
      Boolean(eventType) && eventType !== selectedEventType;
    setSubmitValidationDialog(null);
    setEventType(selectedEventType);

    const isInternalEvent = selectedEventType === "internalEvent";

    setEventData((prevState) => ({
      ...(isChangingEventType ? INITIAL_EVENT_STATE : prevState),
      isFollowersOnly: isInternalEvent,
    }));
  };

  const handleGoBack = () => {
    setSubmitValidationDialog(null);

    if (currentStep === 0) {
      setCurrentStep(-1);
      return;
    }

    setCurrentStep((step) => step - 1);
  };

  const handleGoForward = () => {
    if (currentStep === -1) {
      if (!eventType) {
        return;
      }

      setCurrentStep(0);
      return;
    }

    setSubmitValidationDialog(null);

    if (currentStep === EventForms.length - 1) {
      handlePostEvent();
    } else {
      setCurrentStep((step) => step + 1);
    }
  };

  const handleEditStep = (step: number) => {
    setSubmitValidationDialog(null);
    setCurrentStep(step);
  };

  const handleSubmitValidationCancel = () => {
    setSubmitValidationDialog(null);
  };

  const handleSubmitValidationConfirm = () => {
    if (!submitValidationDialog) {
      return;
    }

    setCurrentStep(submitValidationDialog.nextStep);
    setSubmitValidationDialog(null);
  };

  const eventStepTitle =
    eventType === "internalEvent"
      ? "Internal Event"
      : "Create Community Event";

  const figureOutStringFromStep = (step: number) => {
    if (step === 0) {
      return "one";
    }
    if (step === 1) {
      return "two";
    }
    if (step === 2) {
      return "three";
    }
    if (step === 3) {
      return "four";
    }
    return "";
  };

  const formStep = figureOutStringFromStep(currentStep);
  const isInternalEvent = eventType === "internalEvent";
  const isCommunityEvent = eventType === "externalEvent";
  const hasText = (value?: unknown) => Boolean(value?.toString().trim());
  const getInvalidStep = () => {
    const eventInfoMissingFields = [
      !hasText(eventData.eventName) ? "Event Name" : "",
      !hasText(eventData.eventDate) ? "Date" : "",
      toNumber(eventData.startTime) <= 0 ? "Start Time" : "",
      toNumber(eventData.endTime) <= 0 ? "End Time" : "",
      toNumber(eventData.endTime) > 0 &&
      toNumber(eventData.startTime) > 0 &&
      toNumber(eventData.endTime) <= toNumber(eventData.startTime)
        ? "Valid Time Range"
        : "",
      !hasValue(eventData.eventDescription) ? "Description" : "",
      !isInternalEvent && toNumber(eventData.maxVolunteerCount) <= 0
        ? "# Of Volunteers Needed"
        : "",
      !isInternalEvent && !hasValue(eventData.eventHoursNeeded)
        ? "# Of Hours Needed"
        : "",
    ].filter(Boolean);

    if (eventInfoMissingFields.length > 0) {
      return {
        nextStep: 0,
        missingFields: eventInfoMissingFields,
      };
    }

    const eventLocationMissingFields = [
      !hasText(eventData.eventAddress.locationName) ? "Location Name" : "",
      !hasText(eventData.eventAddress.streetName) ? "Street Name" : "",
      !hasText(eventData.eventAddress.city) ? "City" : "",
      !isInternalEvent &&
      !isCommunityEvent &&
      !hasText(eventData.eventAddress.zipCode)
        ? "Zip Code"
        : "",
      !eventData.isIndoor && !eventData.isOutdoor ? "Indoor or Outdoor" : "",
      (isInternalEvent || isCommunityEvent) &&
      !hasValue(eventData.eventInternalLocation)
        ? "Assignment Location"
        : "",
    ].filter(Boolean);

    if (eventLocationMissingFields.length > 0) {
      return {
        nextStep: 1,
        missingFields: eventLocationMissingFields,
      };
    }

    const eventDetailsMissingFields = [
      !hasValue(eventData.eventCoordinator) ? "Coordinator" : "",
      !eventData.volunteerImpact.isIndividualImpact &&
      !eventData.volunteerImpact.isGroupImpact
        ? "Volunteer Impact Type"
        : "",
      eventData.volunteerImpact.isIndividualImpact &&
      !hasValue(eventData.volunteerImpact.individualImpactPerHour)
        ? "Individual Impact Per Hour"
        : "",
      eventData.volunteerImpact.isIndividualImpact &&
      !hasValue(eventData.volunteerImpact.individualImpact)
        ? "Individual Impact"
        : "",
      eventData.volunteerImpact.isGroupImpact &&
      !hasValue(eventData.volunteerImpact.groupImpactPerHour)
        ? "Group Impact Total"
        : "",
      eventData.volunteerImpact.isGroupImpact &&
      !hasValue(eventData.volunteerImpact.groupImpact)
        ? "Group Impact"
        : "",
    ].filter(Boolean);

    if (eventDetailsMissingFields.length > 0) {
      return {
        nextStep: 3,
        missingFields: eventDetailsMissingFields,
      };
    }

    return null;
  };

  const EventForms = [
    <EventInfo
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
    />,
    <EventLocation
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
    />,
    <EventRequirements
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
    />,
    <EventDetails
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
    />,
    <InternalEventReview
      data={eventData}
      eventType={eventType}
      onCancel={handleGoBack}
      onEditStep={handleEditStep}
      onSubmit={handlePostEvent}
    />,
  ];

  const previousButtonText =
    currentStep === EventForms.length - 1 ? "Cancel" : "Back";
  const nextButtonText =
    currentStep === EventForms.length - 1
      ? "Post"
      : !isInternalEvent && currentStep === 3
        ? "Preview"
        : "Next";
  const isSelectionStep = currentStep === -1;
  const isReviewStep = currentStep === EventForms.length - 1;
  const isEventPanelStep =
    !isSelectionStep && !isReviewStep;
  const eventStepSectionHeader = (() => {
    if (currentStep === 0) {
      return "Event Details";
    }

    if (currentStep === 1) {
      return "Location";
    }

    if (currentStep === 2) {
      return "Requirements";
    }

    if (currentStep === 3) {
      return "Other";
    }

    return "Preview";
  })();

  return (
    <div className={styles.postNeed}>
      {isSelectionStep ? (
        <div className={styles.createEventPanel}>
          <div className={styles.createEventHeader}>
            <div />
            <Typography variant="header" textToDisplay="Create Event" />
            <ClosingIcon useNoSx onClick={handleExit} />
          </div>
          <EventType
            onSelect={handleEventSelection}
            selectedEventType={eventType}
          />
          <div className={styles.selectionButtonArea}>
            <DarbeButton
              onClick={handleGoForward}
              isDisabled={!eventType}
              buttonText="Next"
              darbeButtonType="nextButton"
            />
          </div>
        </div>
      ) : isReviewStep ? (
        <InternalEventReview
          data={eventData}
          eventType={eventType}
          onCancel={handleGoBack}
          onEditStep={handleEditStep}
          onSubmit={handlePostEvent}
        />
      ) : isEventPanelStep ? (
        <div
          className={`${styles.createEventPanel} ${styles.eventStepPanel} ${
            currentStep === 3 ? styles.internalOtherPanel : ""
          } ${!isInternalEvent ? styles.communityEventStepPanel : ""} ${
            !isInternalEvent && currentStep === 0
              ? styles.communityEventDetailsPanel
              : ""
          }`}
        >
          <div className={styles.eventStepHeader}>
            <div>
              {currentStep > 0 && (
                <IconButton
                  aria-label="Previous step"
                  onClick={handleGoBack}
                  sx={{ padding: 0 }}
                >
                  <CustomSvgs
                    svgPath="/svgs/common/goBackIcon.svg"
                    altText="Previous step"
                  />
                </IconButton>
              )}
            </div>
            <div className={styles.eventStepTitleArea}>
              <Typography variant="header" textToDisplay={eventStepTitle} />
              <FormSteps step={formStep} entityType="entity" formName="signup" />
            </div>
            <ClosingIcon useNoSx onClick={handleExit} />
          </div>
          <div className={styles.eventStepSectionHeader}>
            <Typography
              variant="whiteBoldText"
              extraClass={styles.eventStepSectionTitle}
              textToDisplay={eventStepSectionHeader}
            />
          </div>
          {EventForms[currentStep]}
          <div className={styles.eventStepButtonArea}>
            <DarbeButton
              onClick={handleGoBack}
              buttonText={previousButtonText}
              darbeButtonType="secondaryNextButton"
            />
            <DarbeButton
              onClick={handleGoForward}
              buttonText={nextButtonText}
              darbeButtonType="nextButton"
            />
          </div>
        </div>
      ) : null}
      {submitValidationDialog ? (
        <div className={styles.postNeedSubmitDialogOverlay}>
          <div
            className={styles.postNeedSubmitDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-need-submit-dialog-title"
          >
            <h2
              className={styles.postNeedSubmitDialogTitle}
              id="post-need-submit-dialog-title"
            >
              Required fields are missing
            </h2>
            <p className={styles.postNeedSubmitDialogText}>
              Please complete the following before submitting:
            </p>
            <ul className={styles.postNeedSubmitDialogList}>
              {submitValidationDialog.missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
            <div className={styles.postNeedSubmitDialogActions}>
              <DarbeButton
                buttonText="Cancel"
                darbeButtonType="secondaryNextButton"
                onClick={handleSubmitValidationCancel}
              />
              <DarbeButton
                buttonText="Fix It"
                darbeButtonType="nextButton"
                onClick={handleSubmitValidationConfirm}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
