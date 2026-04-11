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
  onChange,
  markError,
}: EventFormCommonProps) => {
  const [errors, setErrors] = useState({
    eventName: "",
    eventDate: "",
    maxVolunteerCount: "",
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

  return (
    <div className={styles.eventFormArea}>
      <Inputs
        label="Event Name"
        darbeInputType="standardInput"
        name="eventName"
        isRequired
        errorHelperText={errors.eventName}
        value={data.eventName}
        error={!!errors.eventName}
        handleChange={handleChange}
        placeholder="Enter Event Name"
      />

      <Inputs
        label="Description"
        isTextArea
        darbeInputType="textAreaInput"
        value={data.eventDescription}
        handleChange={handleChange}
        name="eventDescription"
        placeholder="Enter Event Description"
      />

      <Inputs
        label="Date"
        darbeInputType="standardInput"
        isRequired
        errorHelperText={errors.eventDate}
        value={data.eventDate?.toLocaleString()}
        error={!!errors.eventDate}
        handleChange={handleChange}
        name="eventDate"
        placeholder="MM-DD-YYYY"
      />

      <Inputs
        label="# of Volunteers Needed"
        darbeInputType="standardInput"
        isRequired
        errorHelperText={errors.maxVolunteerCount}
        value={data.maxVolunteerCount}
        error={!!errors.maxVolunteerCount}
        handleChange={handleChange}
        name="maxVolunteerCount"
        placeholder="Enter # of Volunteers"
      />

      <div className={styles.dropdownInputsArea}>
        <Dropdown
          name="startTime"
          label="Start Time"
          error={!!errors.startTime}
          errorHelperText={errors.startTime}
          initialValue={data.startTime.toString()}
          onChange={handleDropdownChange}
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
          label="End Time"
          initialValue={data?.endTime ? data?.endTime.toString() : ""}
          onChange={handleDropdownChange}
        >
          {hours()}
        </Dropdown>
      </div>

      <div className={styles.checkBoxInputsArea}>
        <CheckBox
          name="isRepeating"
          label="Repeating Event"
          labelPlacement="right"
          textVariant="bold"
          defaultChecked={data.isRepeating}
          onChange={handleCheckboxChange}
        />
      </div>
    </div>
  );
};
