import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { SimpleHeader } from "../../components/simpleHeader/SimpleHeader";
import { DarbeButton } from "../../components/buttons/DarbeButton";
import { SimpleSubHeader } from "../../components/simpleHeader/SimpleSubHeader";
import { EventDetailCard } from "../../components/events/EventDetailCard";
import { CreateEvent } from "../../services/api/endpoints/types/events.api.types";
import { FormSteps } from "../../components/formSteps/FormSteps";
import { useCreateEventMutation } from "../../services/api/endpoints/events/events.api";
import { useAppSelector } from "../../services/hooks";
import { EVENTS_ROUTE } from "../../routes/route.constants";
import { selectCurrentUserId } from "../users/selectors";
import { EventDetails } from "./forms/EventDetails";
import { EventInfo } from "./forms/EventInfo";
import { EventLocation } from "./forms/EventLocation";
import { EventRequirements } from "./forms/EventRequirements";
import { EventType } from "./EventType";

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
      // build the payload with the current userId
      const payload: CreateEvent = {
        ...eventData,
        // set the event owner to the current user
        eventOwner: userId,
      };

      await createEvent(payload).unwrap();
      navigate(EVENTS_ROUTE);
    } catch (error) {
      console.error("Error posting event", error);
    }
  };

  const handleEventSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEventType(event.target.name);
    setCurrentStep((step) => step + 1);

    const isInternalEvent = event.target.name === "internalEvent";

    setEventData((prevState) => ({
      ...prevState,
      isFollowersOnly: isInternalEvent,
    }));
  };

  const handleGoBack = () => {
    setCurrentStep((step) => step - 1);
    if (currentStep === -1) {
      setEventType("");
    }
  };

  const handleGoForward = () => {
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

  const headerText = figureOutEventHeader();
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

  return (
    <div className={styles.postNeed}>
      {!notEditingForm && (
        <FormSteps step={formStep} entityType="entity" formName="signup" />
      )}
      <SimpleHeader headerText={headerText} textVariant="header" />
      {currentStep === -1 ? (
        <EventType onClick={handleEventSelection} />
      ) : (
        <>
          <SimpleSubHeader
            headerText={figureOutSubHeaderText()}
            variants="formHeader"
          />
          {EventForms[currentStep]}
        </>
      )}
      <div className={styles.buttonArea}>
        {currentStep > -1 && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
