import { RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material";

import { EventFormCommonProps } from "../types";
import { Inputs } from "../../../components/inputs/Inputs";
import { CheckBox } from "../../../components/checkbox/Checkbox";

import styles from "../styles/postNeed.module.css";

export const EventLocation = ({
  data,
  eventType,
  onChange,
}: EventFormCommonProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;

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

  const isInternalEvent = eventType === "internalEvent";
  const isCommunityEvent = eventType === "externalEvent";
  const selectedRadioStyles: SvgIconProps["sx"] = { color: "#088F26" };
  const isLocationNameValid = Boolean(data.eventAddress.locationName);
  const isStreetNameValid = Boolean(data.eventAddress.streetName);
  const isCityValid = Boolean(data.eventAddress.city);
  const isZipCodeValid = Boolean(data.eventAddress.zipCode);
  const isParkingValid = Boolean(data.eventParkingInfo);
  const isAddressValid =
    isLocationNameValid &&
    isStreetNameValid &&
    isCityValid &&
    (isInternalEvent || isCommunityEvent || isZipCodeValid);
  const getInternalLocationFieldClassName = (isValid: boolean) =>
    `${styles.internalLocationInputField} ${
      isValid ? styles.internalLocationValidField : ""
    }`;

  return (
    <div
      className={`${styles.eventFormArea} ${styles.internalLocationForm} ${
        isCommunityEvent ? styles.communityLocationForm : ""
      }`}
    >
      <div className={styles.internalLocationAddressGroup}>
        <span className={styles.internalLocationLabel}>
          Event Address
          {(isCommunityEvent || isAddressValid) && (
            <span className={styles.requiredIndicator}>*</span>
          )}
        </span>
        <div className={getInternalLocationFieldClassName(isLocationNameValid)}>
          <Inputs
            label=""
            darbeInputType="standardInput"
            value={data.eventAddress.locationName}
            name="locationName"
            handleChange={handleChange}
            placeholder="Location Name"
          />
        </div>
        <div className={getInternalLocationFieldClassName(isStreetNameValid)}>
          <Inputs
            label=""
            darbeInputType="standardInput"
            name="streetName"
            value={data.eventAddress.streetName}
            handleChange={handleChange}
            placeholder="123 Main St."
          />
        </div>
        <div className={getInternalLocationFieldClassName(isCityValid)}>
          <Inputs
            label=""
            darbeInputType="standardInput"
            name="city"
            value={data.eventAddress.city}
            handleChange={handleChange}
            placeholder="Houston, TX 77001"
          />
        </div>
        {!isInternalEvent && !isCommunityEvent && (
          <div className={getInternalLocationFieldClassName(isZipCodeValid)}>
            <Inputs
              label=""
              darbeInputType="standardInput"
              value={data.eventAddress.zipCode}
              handleChange={handleChange}
              name="zipCode"
              placeholder="Zip Code"
            />
          </div>
        )}
      </div>

      <div
        className={`${styles.internalLocationParkingField} ${
          isParkingValid ? styles.internalLocationValidField : ""
        }`}
      >
        <span className={styles.internalLocationLabel}>
          Parking Details
          {isCommunityEvent && <span className={styles.requiredIndicator}>*</span>}
        </span>
        <Inputs
          label=""
          isTextArea
          darbeInputType="textAreaInput"
          value={data.eventParkingInfo}
          handleChange={handleUnnestedChange}
          name="eventParkingInfo"
          placeholder={
            isCommunityEvent ? "Infront of Building A..." : "In front of Building A..."
          }
        />
      </div>

      <div className={styles.internalLocationTypeOptions}>
        <CheckBox
          name="isIndoor"
          label="Indoor"
          labelPlacement="right"
          textVariant="bold"
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked sx={selectedRadioStyles} />}
          checked={!!data.isIndoor}
          onChange={handleCheckboxChange}
        />
        <CheckBox
          name="isOutdoor"
          label="Outdoor"
          labelPlacement="right"
          textVariant="bold"
          icon={<RadioButtonUnchecked />}
          checkedIcon={<RadioButtonChecked sx={selectedRadioStyles} />}
          checked={!!data.isOutdoor}
          onChange={handleCheckboxChange}
        />
      </div>

      {(isInternalEvent || isCommunityEvent) && (
        <div className={styles.internalLocationAssignmentField}>
          <span className={styles.internalLocationLabel}>
            Assignment Location
            {(isInternalEvent || isCommunityEvent) && (
              <span className={styles.requiredIndicator}>*</span>
            )}
          </span>
          <div
            className={getInternalLocationFieldClassName(
              Boolean(data.eventInternalLocation)
            )}
          >
            <Inputs
              label=""
              darbeInputType="standardInput"
              value={data.eventInternalLocation}
              handleChange={handleUnnestedChange}
              name="eventInternalLocation"
              placeholder="Indoor Main Hall"
            />
          </div>
        </div>
      )}
    </div>
  );
};
