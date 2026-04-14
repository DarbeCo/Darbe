import { useState } from "react";

import { SignUpState } from "../types";
import styles from "../styles/signUpPage.module.css";
import { Dropdown } from "../../../components/dropdowns/Dropdown";
import { Causes } from "../../../components/causes/Causes";
import { Availability } from "../../../components/availability/Availability";
import { DropdownTypes } from "../../../components/dropdowns/DropdownTypes";

import { Inputs } from "../../../components/inputs/Inputs";
import {
  isGoodEnoughPassword,
  isValidBetaZipCode,
  isValidEmail,
  isValidName,
} from "../../../utils/formUtils/formUtils";

interface UserInputsProps {
  step: number;
  data: SignUpState;
  updateFormData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateCauseData: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  updateDropdownData: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  updateAvailabilityCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateAvailabilityData: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  markError: (hasError: boolean) => void;
  emailAvailabilityError?: string | null;
}

export const UserInputs = ({
  step,
  data,
  updateFormData,
  updateCauseData,
  updateDropdownData,
  updateAvailabilityCheckbox,
  updateAvailabilityData,
  markError,
  emailAvailabilityError,
}: UserInputsProps) => {
  const [errors, setErrors] = useState({
    email: false,
    password: false,
    zip: false,
    firstName: false,
    lastName: false,
  });

  const dayOptions = DropdownTypes({ type: "days" });
  const monthOptions = DropdownTypes({ type: "months" });
  const yearOptions = DropdownTypes({ type: "years" });

  const runErrorChecks = (name: string) => {
    let validEmail = true;
    let validPassword = true;
    let validZip = true;
    let validFirstName = true;
    let validLastName = true;

    if (step === 1) {
      if (name === "email") {
        validEmail = isValidEmail(data.email);
      }
      if (name === "password") {
        validPassword = isGoodEnoughPassword(data.password);
      }
    }
    if (step === 2) {
      if (name === "zip") {
        validZip = isValidBetaZipCode(data.zip);
      }
      if (name === "firstName") {
        validFirstName = isValidName(data.firstName);
      }
      if (name === "lastName") {
        validLastName = isValidName(data.lastName);
      }
    }

    const anyErrors =
      !validEmail ||
      !validPassword ||
      !validZip ||
      !validFirstName ||
      !validLastName;

    if (anyErrors) {
      markError(true);
    }
    if (!anyErrors) {
      markError(false);
    }

    setErrors({
      email: !validEmail,
      password: !validPassword,
      zip: !validZip,
      firstName: !validFirstName,
      lastName: !validLastName,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target as { name: keyof typeof errors };

    runErrorChecks(name);

    updateFormData(e);
  };

  const individualForms = [
    <>
      <Inputs
        key={`${step}-email`}
        label="Email"
        error={errors.email || !!emailAvailabilityError}
        value={data.email}
        errorHelperText={
          errors.email
            ? "Please enter a valid email address"
            : emailAvailabilityError ?? ""
        }
        darbeInputType="standardInput"
        handleChange={handleChange}
        name="email"
        type="email"
        placeholder="volunteer@email.com"
        isRequired
      />
      <Inputs
        key={`${step}-password`}
        label="Password"
        darbeInputType="standardInput"
        error={errors.password}
        value={data.password}
        errorHelperText="Password must be at least 8 characters long and contain at least one letter and one number"
        handleChange={handleChange}
        placeholder=" * * * * *"
        name="password"
        type="password"
        isRequired
      />
    </>,
    <>
      <Inputs
        key={`${step}-firstName`}
        label="First Name"
        darbeInputType="standardInput"
        error={errors.firstName}
        value={data.firstName}
        errorHelperText="Please enter a valid first name"
        handleChange={handleChange}
        name="firstName"
        placeholder="John"
        isRequired
      />
      <Inputs
        key={`${step}-lastName`}
        label="Last Name"
        error={errors.lastName}
        value={data.lastName}
        errorHelperText="Please enter a valid last name"
        darbeInputType="standardInput"
        handleChange={handleChange}
        name="lastName"
        placeholder="Doe"
        isRequired
      />
      <Inputs
        key={`${step}-dob`}
        label="City"
        darbeInputType="standardInput"
        value={data.city}
        handleChange={handleChange}
        name="city"
        placeholder="Houston"
        isRequired
      />
      <Inputs
        key={`${step}-zip`}
        label="Zip Code"
        darbeInputType="standardInput"
        error={errors.zip}
        value={data.zip}
        errorHelperText="Darbe is only available in Houston and surrounding areas at the moment"
        handleChange={handleChange}
        name="zip"
        placeholder="10001"
        isRequired
      />
      <div className={styles.dob}>
        <Dropdown
          name="day"
          label="Day"
          initialValue={data?.dob?.day}
          onChange={updateDropdownData}
        >
          {dayOptions()}
        </Dropdown>
        <Dropdown
          name="month"
          label="Month"
          initialValue={data?.dob?.month}
          onChange={updateDropdownData}
        >
          {monthOptions()}
        </Dropdown>
        <Dropdown
          name="year"
          label="Year"
          initialValue={data?.dob?.year}
          onChange={updateDropdownData}
        >
          {yearOptions()}
        </Dropdown>
      </div>
    </>,
    <>
      <Causes isIndividual onChange={updateCauseData} />
    </>,
    <>
      <Availability
        onCheckboxChange={updateAvailabilityCheckbox}
        onAvailabilityChange={updateAvailabilityData}
        startingAvailability={data.availability}
      />
    </>,
  ];

  return <>{individualForms[step - 1]}</>;
};
