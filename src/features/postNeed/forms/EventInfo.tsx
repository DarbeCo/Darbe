import { useCallback, useState } from "react";

import { EventFormCommonProps } from "../types";
import { Inputs } from "../../../components/inputs/Inputs";
import { Dropdown } from "../../../components/dropdowns/Dropdown";
import { CheckBox } from "../../../components/checkbox/Checkbox";
import { DropdownTypes } from "../../../components/dropdowns/DropdownTypes";
import { Typography } from "../../../components/typography/Typography";
import { debounce } from "../../../utils/CommonFunctions";
import { validateField } from "../utils";

import styles from "../styles/postNeed.module.css";

export const EventInfo = ({
  data,
  eventType,
  onChange,
  markError,
}: EventFormCommonProps) => {
  const [errors, setErrors] = useState({
    eventName: "",
    eventDate: "",
    maxVolunteerCount: "",
    eventHoursNeeded: "",
    startTime: "",
  });

  const runErrorChecks = useCallback(
    debounce((name: string, value: any) => {
      const error = validateField(name, value);

      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }));

      const anyErrors = error !== "";

      markError(anyErrors);
    }, 300),
    [errors, markError]
  );

  const handleDropdownChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    runErrorChecks(name, value);

    if (onChange) {
      onChange((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    runErrorChecks(name, value);

    onChange?.((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const formattedValue = formatDateDisplayValue(value);

    runErrorChecks(name, formattedValue);

    onChange?.((prevState) => ({
      ...prevState,
      [name]: formattedValue,
    }));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;

    if (onChange) {
      onChange((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
    }
  };

  const hours = DropdownTypes({ type: "hours" });
  const isInternalEvent = eventType === "internalEvent";
  const isCommunityEvent = eventType === "externalEvent";
  const useStepPanelLayout =
    eventType === "internalEvent" || eventType === "externalEvent";
  const hasValidInternalTime = data.startTime !== 0 && data.endTime !== 0;
  const formatDateInputValue = (value: string | Date | undefined) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      const mmDdYyyyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);

      if (mmDdYyyyMatch) {
        const [, month, day, year] = mmDdYyyyMatch;
        return `${year}-${month}-${day}`;
      }

      return value.split("T")[0];
    }

    return value.toISOString().split("T")[0];
  };
  const formatDateDisplayValue = (value: string) => {
    if (!value) {
      return "";
    }

    const [year, month, day] = value.split("-");

    return `${month}-${day}-${year}`;
  };
  const getInternalFieldClassName = (
    fieldClassName: string,
    isValid: boolean
  ) =>
    `${styles.internalFormField} ${fieldClassName} ${
      isValid ? styles.internalValidField : ""
    }`;

  return (
    <div
      className={`${styles.eventFormArea} ${
        useStepPanelLayout ? styles.internalEventDetailsForm : ""
      } ${isCommunityEvent ? styles.communityEventDetailsForm : ""}`}
    >
      <div
        className={
          useStepPanelLayout
            ? getInternalFieldClassName(
                styles.internalEventNameField,
                Boolean(data.eventName)
              )
            : ""
        }
      >
        <Inputs
          label="Event Name"
          darbeInputType="standardInput"
          name="eventName"
          isRequired
          errorHelperText={errors.eventName}
          value={data.eventName}
          error={!!errors.eventName}
          handleChange={handleChange}
          placeholder={useStepPanelLayout ? "Event Name" : "Enter Event Name"}
        />
        {useStepPanelLayout && (
          <span className={styles.internalCharacterCount}>
            {data.eventName.length}/50
          </span>
        )}
      </div>

      <div
        className={
          useStepPanelLayout
            ? getInternalFieldClassName(
                styles.internalDateField,
                Boolean(data.eventDate)
              )
            : ""
        }
      >
        <Inputs
          label="Date"
          darbeInputType="standardInput"
          type="date"
          isRequired
          errorHelperText={errors.eventDate}
          value={formatDateInputValue(data.eventDate)}
          error={!!errors.eventDate}
          handleChange={handleDateChange}
          name="eventDate"
          placeholder="MM-DD-YYYY"
        />
      </div>

      <div
        className={
          useStepPanelLayout
            ? getInternalFieldClassName(
                styles.internalDescriptionField,
                Boolean(data.eventDescription)
              )
            : ""
        }
      >
        <Inputs
          label="Description"
          isRequired={isInternalEvent || isCommunityEvent}
          isTextArea
          darbeInputType="textAreaInput"
          value={data.eventDescription}
          handleChange={handleChange}
          name="eventDescription"
          placeholder={
            useStepPanelLayout
              ? "Description of the event..."
              : "Enter Event Description"
          }
        />
        {useStepPanelLayout && (
          <span className={styles.internalCharacterCount}>
            {data.eventDescription.length}/50
          </span>
        )}
      </div>

      {!isInternalEvent && (
        <div
          className={
            useStepPanelLayout
              ? getInternalFieldClassName(
                  styles.internalMaxVolunteerField,
                  Boolean(data.maxVolunteerCount)
                )
              : ""
          }
        >
          <Inputs
            label="# Of Volunteers Needed"
            darbeInputType="standardInput"
            isRequired
            errorHelperText={errors.maxVolunteerCount}
            value={data.maxVolunteerCount}
            error={!!errors.maxVolunteerCount}
            handleChange={handleChange}
            name="maxVolunteerCount"
            placeholder={
              isCommunityEvent
                ? "Volunteers"
                : useStepPanelLayout
                  ? "# of Volunteers Needed"
                  : "Enter # of Volunteers"
            }
          />
        </div>
      )}

      {isCommunityEvent && (
        <div
          className={getInternalFieldClassName(
            styles.communityHoursNeededField,
            Boolean(data.eventHoursNeeded)
          )}
        >
          <Inputs
            label="# Of Hours Needed"
            darbeInputType="standardInput"
            isRequired
            errorHelperText={errors.eventHoursNeeded}
            value={data.eventHoursNeeded || ""}
            error={!!errors.eventHoursNeeded}
            handleChange={handleChange}
            name="eventHoursNeeded"
            placeholder="Hours"
          />
        </div>
      )}

      <div
        className={
          useStepPanelLayout
            ? `${styles.internalTimeArea} ${
                hasValidInternalTime ? styles.internalValidTimeArea : ""
              }`
            : styles.dropdownInputsArea
        }
      >
        {useStepPanelLayout && (
          <span className={styles.internalFieldLabel}>
            Time<span className={styles.requiredIndicator}>*</span>
          </span>
        )}
        <Dropdown
          name="startTime"
          label={useStepPanelLayout ? "" : "Start Time"}
          error={!!errors.startTime}
          errorHelperText={errors.startTime}
          initialValue={
            useStepPanelLayout && !data.startTime
              ? "9"
              : data.startTime.toString()
          }
          onChange={handleDropdownChange}
          variant={
            isCommunityEvent
              ? "communityEventTime"
              : useStepPanelLayout
                ? "internalEventTime"
                : "default"
          }
          isValid={useStepPanelLayout && hasValidInternalTime}
        >
          {hours()}
        </Dropdown>
        <Typography
          variant="grayText"
          textToDisplay="To"
          extraClass="paddingTop"
        />
        <Dropdown
          name="endTime"
          label={useStepPanelLayout ? "" : "End Time"}
          initialValue={
            useStepPanelLayout && !data.endTime
              ? "21"
              : data?.endTime
                ? data?.endTime.toString()
                : ""
          }
          onChange={handleDropdownChange}
          variant={
            isCommunityEvent
              ? "communityEventTime"
              : useStepPanelLayout
                ? "internalEventTime"
                : "default"
          }
          isValid={useStepPanelLayout && hasValidInternalTime}
        >
          {hours()}
        </Dropdown>
      </div>

      <div
        className={
          useStepPanelLayout
            ? styles.internalRepeatingEvent
            : styles.checkBoxInputsArea
        }
      >
        <CheckBox
          name="isRepeating"
          label="Repeating Event"
          labelPlacement="right"
          textVariant="bold"
          checked={data.isRepeating}
          onChange={handleCheckboxChange}
        />
      </div>

      {isCommunityEvent && (
        <div className={styles.communityMembersOnlyEvent}>
          <CheckBox
            name="isFollowersOnly"
            label="Members Only Event"
            labelPlacement="right"
            textVariant="bold"
            checked={!!data.isFollowersOnly}
            onChange={handleCheckboxChange}
          />
        </div>
      )}
    </div>
  );
};
