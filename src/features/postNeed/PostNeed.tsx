import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";

import { SimpleHeader } from "../../components/simpleHeader/SimpleHeader";
import { DarbeButton } from "../../components/buttons/DarbeButton";
import { SimpleSubHeader } from "../../components/simpleHeader/SimpleSubHeader";
import { EventDetailCard } from "../../components/events/EventDetailCard";
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

export const PostNeed = () => {
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const [errorFound, setErrorFound] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [eventType, setEventType] = useState("");
  const [eventData, setEventData] = useState<CreateEvent>(INITIAL_EVENT_STATE);
  const [createEvent] = useCreateEventMutation();

  const handlePostEvent = async () => {
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
        isFollowersOnly: isInternalEvent,
        // set the event owner to the current user
        eventOwner: userId,
      };

      await createEvent(payload).unwrap();
      navigate(EVENTS_ROUTE);
    } catch (error) {
      console.error("Error posting event", error);
    }
  };

  const handleExit = () => {
    navigate(HOME_ROUTE);
  };

  const handleEventSelection = (selectedEventType: string) => {
    setEventType(selectedEventType);

    const isInternalEvent = selectedEventType === "internalEvent";

    setEventData((prevState) => ({
      ...prevState,
      isFollowersOnly: isInternalEvent,
    }));
  };

  const handleGoBack = () => {
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

    if (currentStep === EventForms.length - 1) {
      handlePostEvent();
    } else {
      setCurrentStep((step) => step + 1);
    }
  };

  const figureOutEventHeader = () => {
    if (eventType) {
      return eventType === "internalEvent"
        ? "Internal Event"
        : "External Event";
    } else {
      return "Create Event";
    }
  };

  const figureOutSubHeaderText = () => {
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
      return "Admin Details";
    }
    if (currentStep === 4) {
      return "Preview";
    }
    return "";
  };

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
  const markError = (hasError: boolean) => {
    setErrorFound(hasError);
  };

  const EventForms = [
    <EventInfo
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
      markError={markError}
    />,
    <EventLocation
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
      markError={markError}
    />,
    <EventRequirements
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
      markError={markError}
    />,
    <EventDetails
      data={eventData}
      eventType={eventType}
      onChange={setEventData}
      markError={markError}
    />,
    <EventDetailCard previewEventData={eventData} isPreview />,
  ];

  const previousButtonText =
    currentStep === EventForms.length - 1 ? "Cancel" : "Back";
  const nextButtonText =
    currentStep === EventForms.length - 1 ? "Post" : "Next";
  const notEditingForm =
    currentStep === -1 || currentStep === EventForms.length - 1;
  const isSelectionStep = currentStep === -1;
  const isInternalEventDetailsStep =
    eventType === "internalEvent" && currentStep === 0;
  const isInternalEventLocationStep =
    eventType === "internalEvent" && currentStep === 1;
  const isInternalEventRequirementsStep =
    eventType === "internalEvent" && currentStep === 2;
  const isInternalEventOtherStep =
    eventType === "internalEvent" && currentStep === 3;
  const isInternalEventReviewStep =
    eventType === "internalEvent" && currentStep === 4;
  const isInternalEventPanelStep =
    isInternalEventDetailsStep ||
    isInternalEventLocationStep ||
    isInternalEventRequirementsStep ||
    isInternalEventOtherStep;
  const isInternalEventLocationValid =
    Boolean(eventData.eventAddress.locationName) &&
    Boolean(eventData.eventAddress.streetName) &&
    Boolean(eventData.eventAddress.city) &&
    Boolean(eventData.eventParkingInfo) &&
    (eventData.isIndoor || eventData.isOutdoor);
  const internalEventSectionHeader = isInternalEventDetailsStep
    ? "Event Details"
    : isInternalEventRequirementsStep
      ? "Requirements"
      : isInternalEventOtherStep
        ? "Other"
        : isInternalEventLocationValid
          ? "Location"
          : "Physical Location";

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
      ) : isInternalEventReviewStep ? (
        <InternalEventReview
          data={eventData}
          onCancel={handleGoBack}
          onSubmit={handlePostEvent}
        />
      ) : isInternalEventPanelStep ? (
        <div
          className={`${styles.createEventPanel} ${styles.eventStepPanel} ${
            isInternalEventOtherStep ? styles.internalOtherPanel : ""
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
              <Typography variant="header" textToDisplay="Internal Event" />
              <FormSteps step={formStep} entityType="entity" formName="signup" />
            </div>
            <ClosingIcon useNoSx onClick={handleExit} />
          </div>
          <div className={styles.eventStepSectionHeader}>
            <Typography
              variant="whiteBoldText"
              extraClass={styles.eventStepSectionTitle}
              textToDisplay={internalEventSectionHeader}
            />
          </div>
          {EventForms[currentStep]}
          <div className={styles.eventStepButtonArea}>
            <DarbeButton
              onClick={handleGoBack}
              isDisabled={errorFound}
              buttonText="Previous"
              darbeButtonType="secondaryNextButton"
            />
            <DarbeButton
              onClick={handleGoForward}
              isDisabled={errorFound}
              buttonText={nextButtonText}
              darbeButtonType="nextButton"
            />
          </div>
        </div>
      ) : (
        <>
          {!notEditingForm && (
            <FormSteps step={formStep} entityType="entity" formName="signup" />
          )}
          <SimpleHeader
            headerText={figureOutEventHeader()}
            textVariant="header"
          />
          <SimpleSubHeader
            headerText={figureOutSubHeaderText()}
            variants="formHeader"
          />
          {EventForms[currentStep]}
        </>
      )}
      {!isSelectionStep && !isInternalEventPanelStep && !isInternalEventReviewStep && (
        <div className={styles.buttonArea}>
          <DarbeButton
            onClick={handleGoBack}
            isDisabled={errorFound}
            buttonText={previousButtonText}
            darbeButtonType="secondaryNextButton"
          />
          <DarbeButton
            onClick={handleGoForward}
            isDisabled={errorFound}
            buttonText={nextButtonText}
            darbeButtonType="nextButton"
          />
        </div>
      )}
    </div>
  );
};
