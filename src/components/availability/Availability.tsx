import { type Availability as StartingAvailabilityState } from "../../services/types/availability.types";
import { capitalizeFirstLetter } from "../../utils/CommonFunctions";
import { CheckBox } from "../checkbox/Checkbox";
import { Dropdown } from "../dropdowns/Dropdown";
import { DropdownTypes } from "../dropdowns/DropdownTypes";

import styles from "./styles/availability.module.css";

interface AvailabilityProps {
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvailabilityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  startingAvailability?: StartingAvailabilityState;
}

export const Availability = ({
  onCheckboxChange,
  onAvailabilityChange,
  startingAvailability,
}: AvailabilityProps) => {
  const hours = DropdownTypes({ type: "hours" });
  const daysInWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const availabilityDays = daysInWeek.map((day) => {
    const isDayOpen =
      startingAvailability?.[day as keyof StartingAvailabilityState]?.open ??
      false;

    const startingHour =
      startingAvailability?.[day as keyof StartingAvailabilityState]?.start;
    const endingHour =
      startingAvailability?.[day as keyof StartingAvailabilityState]?.end;

    return (
      <div className={styles.availabilityDays} key={day}>
        <div className={styles.allDay}>
          <CheckBox
            name={`availability ${day}`}
            labelPlacement="right"
            defaultChecked={isDayOpen}
            label={capitalizeFirstLetter(day)}
            onChange={onCheckboxChange}
          />
        </div>
        <div className={styles.availabilityDay}>
          <Dropdown
            name={`availability ${day} start`}
            onChange={onAvailabilityChange}
            initialValue={startingHour}
          >
            {hours()}
          </Dropdown>
          <span className={styles.tinyTo}>to</span>
          <Dropdown
            name={`availability ${day} end`}
            onChange={onAvailabilityChange}
            initialValue={endingHour}
          >
            {hours()}
          </Dropdown>
        </div>
      </div>
    );
  });

  return (
    <div className={styles.availabilityContainer}>
      <span className={styles.availabilityTitle}>
        Please Set Your Availability
      </span>
      {availabilityDays}
    </div>
  );
};
