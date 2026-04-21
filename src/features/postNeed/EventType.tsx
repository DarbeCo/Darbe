import { RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material";
import { CheckBox } from "../../components/checkbox/Checkbox";
import { Typography } from "../../components/typography/Typography";

import styles from "./styles/postNeed.module.css";

interface EventTypeProps {
  onSelect: (eventType: string) => void;
  selectedEventType: string;
}

export const EventType = ({ onSelect, selectedEventType }: EventTypeProps) => {
  const selectedRadioStyles: SvgIconProps["sx"] = { color: "#088F26" };
  const hasSelectedEventType = Boolean(selectedEventType);

  const getEventTypeCardClassName = (eventType: string) => {
    const isSelected = selectedEventType === eventType;

    return `${styles.eventTypeCard} ${
      isSelected ? styles.selectedEventTypeCard : ""
    } ${
      hasSelectedEventType && !isSelected ? styles.unselectedEventTypeCard : ""
    }`;
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    eventType: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(eventType);
    }
  };

  return (
    <div className={styles.eventTypeCards}>
      <div
        role="button"
        tabIndex={0}
        className={getEventTypeCardClassName("internalEvent")}
        onClick={() => onSelect("internalEvent")}
        onKeyDown={(event) => handleKeyDown(event, "internalEvent")}
      >
        <CheckBox
          onChange={() => onSelect("internalEvent")}
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked sx={selectedRadioStyles} />}
          checked={selectedEventType === "internalEvent"}
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
        tabIndex={0}
        className={getEventTypeCardClassName("externalEvent")}
        onClick={() => onSelect("externalEvent")}
        onKeyDown={(event) => handleKeyDown(event, "externalEvent")}
      >
        <CheckBox
          onChange={() => onSelect("externalEvent")}
          checkedIcon={<RadioButtonChecked sx={selectedRadioStyles} />}
          icon={<RadioButtonUnchecked />}
          checked={selectedEventType === "externalEvent"}
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
