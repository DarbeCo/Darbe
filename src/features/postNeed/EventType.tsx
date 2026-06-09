import { RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material";
import { CheckBox } from "../../components/checkbox/Checkbox";
import { Typography } from "../../components/typography/Typography";

import styles from "./styles/postNeed.module.css";

interface EventTypeProps {
  onSelect: (eventType: string) => void;
  selectedEventType: string;
  allowExternalEvent?: boolean;
}

export const EventType = ({
  onSelect,
  selectedEventType,
  allowExternalEvent = true,
}: EventTypeProps) => {
  const selectedRadioStyles: SvgIconProps["sx"] = { color: "#088F26" };
  const hasSelectedEventType = Boolean(selectedEventType);

  const getEventTypeCardClassName = (eventType: string) => {
    const isSelected = selectedEventType === eventType;
    const isDisabled = eventType === "externalEvent" && !allowExternalEvent;

    return `${styles.eventTypeCard} ${
      isSelected ? styles.selectedEventTypeCard : ""
    } ${
      hasSelectedEventType && !isSelected ? styles.unselectedEventTypeCard : ""
    } ${isDisabled ? styles.disabledEventTypeCard : ""}`;
  };

  const selectEventType = (eventType: string) => {
    if (eventType === "externalEvent" && !allowExternalEvent) {
      return;
    }

    onSelect(eventType);
  };

  const getCardTabIndex = (eventType: string) => {
    if (eventType === "externalEvent" && !allowExternalEvent) {
      return -1;
    }

    return 0;
  };

  const getCardAriaDisabled = (eventType: string) => {
    if (eventType === "externalEvent" && !allowExternalEvent) {
      return true;
    }

    return undefined;
  };

  const handleCheckboxChange = (eventType: string) => {
    if (eventType === "externalEvent" && !allowExternalEvent) {
      return;
    }

    onSelect(eventType);
  };

  const isEventTypeDisabled = (eventType: string) =>
    eventType === "externalEvent" && !allowExternalEvent;

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    eventType: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectEventType(eventType);
    }
  };

  return (
    <div className={styles.eventTypeCards}>
      <div
        role="button"
        tabIndex={getCardTabIndex("internalEvent")}
        aria-disabled={getCardAriaDisabled("internalEvent")}
        className={getEventTypeCardClassName("internalEvent")}
        onClick={() => selectEventType("internalEvent")}
        onKeyDown={(event) => handleKeyDown(event, "internalEvent")}
      >
        <CheckBox
          onChange={() => handleCheckboxChange("internalEvent")}
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked sx={selectedRadioStyles} />}
          checked={selectedEventType === "internalEvent"}
          disabled={isEventTypeDisabled("internalEvent")}
          label=""
          name="internalEvent"
          labelPlacement="top"
        />
        <div className={styles.eventTypeCardText}>
          <Typography
            variant="sectionTitle"
            extraClass={styles.eventTypeCardTitle}
            textToDisplay={"Internal Event"}
          />
          <Typography
            variant="text"
            extraClass={styles.eventTypeCardDescription}
            textToDisplay={
              "An event only for your non-profit / organization members (e.g. internal meetings, orientation, etc.)"
            }
          />
        </div>
      </div>
      <div
        role="button"
        tabIndex={getCardTabIndex("externalEvent")}
        aria-disabled={getCardAriaDisabled("externalEvent")}
        className={getEventTypeCardClassName("externalEvent")}
        onClick={() => selectEventType("externalEvent")}
        onKeyDown={(event) => handleKeyDown(event, "externalEvent")}
      >
        <CheckBox
          onChange={() => handleCheckboxChange("externalEvent")}
          checkedIcon={<RadioButtonChecked sx={selectedRadioStyles} />}
          icon={<RadioButtonUnchecked />}
          checked={selectedEventType === "externalEvent"}
          disabled={isEventTypeDisabled("externalEvent")}
          label=""
          name="externalEvent"
          labelPlacement="top"
        />
        <div className={styles.eventTypeCardText}>
          <Typography
            variant="sectionTitle"
            extraClass={styles.eventTypeCardTitle}
            textToDisplay={"Community Event / Post A Need"}
          />
          <Typography
            variant="text"
            extraClass={styles.eventTypeCardDescription}
            textToDisplay={"An event open to all registered Darbe volunteers."}
          />
        </div>
      </div>
    </div>
  );
};
