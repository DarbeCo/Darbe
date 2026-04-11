import { RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";
import { CheckBox } from "../../components/checkbox/Checkbox";
import { Typography } from "../../components/typography/Typography";

import styles from "./styles/postNeed.module.css";

interface EventTypeProps {
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EventType = ({ onClick }: EventTypeProps) => {
  return (
    <div className={styles.eventTypeCards}>
      <div className={styles.eventTypeCard}>
        <CheckBox
          onChange={onClick}
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked />}
          label=""
          name="internalEvent"
          labelPlacement="top"
        />
        <div className={styles.eventTypeCardText}>
          <Typography variant="sectionTitle" textToDisplay={"Internal Event"} />
          <Typography
            variant="text"
            textToDisplay={
              "An event only for your non-profit / organization members (e.g. internal meetings, orientation, etc.)"
            }
          />
        </div>
      </div>
      <div className={styles.eventTypeCard}>
        <CheckBox
          onChange={onClick}
          checkedIcon={<RadioButtonChecked />}
          icon={<RadioButtonUnchecked />}
          label=""
          name="externalEvent"
          labelPlacement="top"
        />
        <div className={styles.eventTypeCardText}>
          <Typography variant="sectionTitle" textToDisplay={"External Event"} />
          <Typography
            variant="text"
            textToDisplay={"An event open to all registered Darbe volunteers"}
          />
        </div>
      </div>
    </div>
  );
};
