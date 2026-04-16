import { type Availability as StartingAvailabilityState } from "../../services/types/availability.types";
import { useCallback, useState } from "react";
import { capitalizeFirstLetter } from "../../utils/CommonFunctions";
import { CheckBox } from "../checkbox/Checkbox";
import { Dropdown } from "../dropdowns/Dropdown";
import { DropdownTypes } from "../dropdowns/DropdownTypes";

import styles from "./styles/availability.module.css";

interface AvailabilityProps {
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvailabilityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  startingAvailability?: StartingAvailabilityState;
  variant?: "default" | "profileDialog";
}

export const Availability = ({
  onCheckboxChange,
  onAvailabilityChange,
  startingAvailability,
  variant = "default",
}: AvailabilityProps) => {
  const hours = DropdownTypes({ type: "hours" });
  const [clearTokens, setClearTokens] = useState<Record<string, number>>({});
  const daysInWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const emitAvailabilityChange = useCallback(
    (day: string, category: "start" | "end", value: string) => {
      onAvailabilityChange({
        target: {
          name: `availability ${day} ${category}`,
          value,
        },
      } as React.ChangeEvent<HTMLSelectElement>);
    },
    [onAvailabilityChange]
  );

  const isProfileDialog = variant === "profileDialog";
  const availabilityDays = daysInWeek.map((day) => {
    const isDayOpen =
      startingAvailability?.[day as keyof StartingAvailabilityState]?.open ??
      false;

    const startingHour =
      startingAvailability?.[day as keyof StartingAvailabilityState]?.start;
    const endingHour =
      startingAvailability?.[day as keyof StartingAvailabilityState]?.end;
    const clearKey = clearTokens[day] ?? 0;
    const handleClearTimes = () => {
      emitAvailabilityChange(day, "start", "");
      emitAvailabilityChange(day, "end", "");
      setClearTokens((prev) => ({ ...prev, [day]: (prev[day] ?? 0) + 1 }));
    };

    return (
      <div className={styles.availabilityDays} key={day}>
        {isProfileDialog ? (
          <div className={styles.profileDialogDayLabel}>
            {capitalizeFirstLetter(day)}
          </div>
        ) : null}
        <div className={styles.allDay}>
          <CheckBox
            name={`availability ${day}`}
            labelPlacement="right"
            defaultChecked={isDayOpen}
            label={isProfileDialog ? "" : capitalizeFirstLetter(day)}
            onChange={onCheckboxChange}
          />
        </div>
        <div className={styles.availabilityDay}>
          <div className={styles.timeDropdown}>
            <Dropdown
              key={`${day}-start-${clearKey}`}
              name={`availability ${day} start`}
              onChange={onAvailabilityChange}
              initialValue={startingHour}
              disabled={isDayOpen}
              displayEmpty
              showClearOption
              variant={isProfileDialog ? "availabilityModal" : "default"}
            >
              {hours()}
            </Dropdown>
          </div>
          <span className={styles.tinyTo}>to</span>
          <div className={styles.timeDropdown}>
            <Dropdown
              key={`${day}-end-${clearKey}`}
              name={`availability ${day} end`}
              onChange={onAvailabilityChange}
              initialValue={endingHour}
              disabled={isDayOpen}
              displayEmpty
              showClearOption
              variant={isProfileDialog ? "availabilityModal" : "default"}
            >
              {hours()}
            </Dropdown>
          </div>
          <button
            type="button"
            className={styles.clearTimesButton}
            onClick={handleClearTimes}
            aria-hidden={isProfileDialog}
            tabIndex={isProfileDialog ? -1 : 0}
          >
            Clear
          </button>
        </div>
      </div>
    );
  });

  return (
    <div
      className={`${styles.availabilityContainer} ${
        isProfileDialog ? styles.availabilityContainerProfileDialog : ""
      }`.trim()}
    >
      {!isProfileDialog && (
        <span className={styles.availabilityTitle}>
          Please Set Your Availability
        </span>
      )}
      {isProfileDialog && (
        <div className={styles.availabilityHeader}>
          <span className={styles.profileDialogDayHeader} />
          <span className={styles.availabilityHeaderLabel}>
            Available All Day
          </span>
          <span className={styles.availabilityHeaderLabel}>
            Select Time Availability
          </span>
        </div>
      )}
      {availabilityDays}
    </div>
  );
};
