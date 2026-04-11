import { RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";

import { EventFormCommonProps } from "../types";
import { Inputs } from "../../../components/inputs/Inputs";
import { CheckBox } from "../../../components/checkbox/Checkbox";

import styles from "../styles/postNeed.module.css";
import { useCallback, useState } from "react";
import debounce from "lodash.debounce";
import { validateField } from "../utils";

export const EventLocation = ({
  data,
  onChange,
  markError,
}: EventFormCommonProps) => {
  const [errors, setErrors] = useState({
    locationName: "",
    streetName: "",
    city: "",
    zipCode: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;

      runErrorChecks(name, value);

      onChange((prevState) => ({
        ...prevState,
        eventAddress: {
          ...prevState.eventAddress,
          [name]: value,
        },
      }));
    }
  };

  const handleUnnestedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;

      runErrorChecks(name, value);

      onChange((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, checked } = e.target;
      onChange((prevState) => {
        // When one option is checked, ensure the other is unchecked
        const updatedState = {
          ...prevState,
          [name]: checked,
        };

        if (checked) {
          if (name === "isIndoor") {
            updatedState.isOutdoor = false;
          } else if (name === "isOutdoor") {
            updatedState.isIndoor = false;
          }
        }

        return updatedState;
      });
    }
  };

  return (
    <div className={styles.eventFormArea}>
      <Inputs
        label="Location Name"
        darbeInputType="standardInput"
        isRequired
        value={data.eventAddress.locationName}
        error={!!errors.locationName}
        errorHelperText={errors.locationName}
        name="locationName"
        handleChange={handleChange}
        placeholder="Stutz Building"
      />

      <Inputs
        label="Streetname"
        darbeInputType="standardInput"
        isRequired
        name="streetName"
        value={data.eventAddress.streetName}
        error={!!errors.streetName}
        errorHelperText={errors.streetName}
        handleChange={handleChange}
        placeholder="1060 N Capitol Ave"
      />

      <Inputs
        label="City"
        darbeInputType="standardInput"
        isRequired
        name="city"
        value={data.eventAddress.city}
        error={!!errors.city}
        errorHelperText={errors.city}
        handleChange={handleChange}
        placeholder="Indianapolis, IN 46204"
      />

      <Inputs
        label="Zip Code"
        darbeInputType="standardInput"
        isRequired
        value={data.eventAddress.zipCode}
        error={!!errors.zipCode}
        errorHelperText={errors.zipCode}
        handleChange={handleChange}
        name="zipCode"
        placeholder="zip code"
      />

      <Inputs
        label="Parking Details"
        isTextArea
        darbeInputType="textAreaInput"
        handleChange={handleUnnestedChange}
        name="eventParkingInfo"
        placeholder="Parking is available in the lot behind the building"
      />

      <Inputs
        label="Assignment Location"
        darbeInputType="standardInput"
        handleChange={handleUnnestedChange}
        name="eventInternalLocation"
        placeholder="Floor 2"
      />

      <div className={styles.checkBoxInputsArea}>
        <CheckBox
          name="isIndoor"
          label="Indoor"
          labelPlacement="right"
          textVariant="bold"
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked />}
          checked={!!data.isIndoor}
          onChange={handleCheckboxChange}
        />
        <CheckBox
          name="isOutdoor"
          label="Outdoor"
          labelPlacement="right"
          textVariant="bold"
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked />}
          checked={!!data.isOutdoor}
          onChange={handleCheckboxChange}
        />
      </div>
    </div>
  );
};
