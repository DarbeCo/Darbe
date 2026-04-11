import { useState } from "react";
import { SignUpState } from "../types";
import {
  isGoodEnoughPassword,
  isValidBetaZipCode,
  isValidCity,
  isValidEINNumber,
  isValidEmail,
  isValidEntityName,
} from "../../../utils/formUtils/formUtils";
import { Inputs } from "../../../components/inputs/Inputs";
import { capitalizeHyphenatedString } from "../../../utils/CommonFunctions";
import { Causes } from "../../../components/causes/Causes";

interface EntityInputsProps {
  entityType: string;
  step: number;
  data: SignUpState;
  updateFormData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateCauseData: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  markError: (hasError: boolean) => void;
  emailAvailabilityError?: string | null;
}

export const EntityInputs = ({
  entityType,
  step,
  data,
  updateFormData,
  updateCauseData,
  markError,
  emailAvailabilityError,
}: EntityInputsProps) => {
  const [errors, setErrors] = useState({
    email: false,
    password: false,
    einNumber: false,
    entityName: false,
    city: false,
    zip: false,
  });

  const capitalizedEntityName = `${capitalizeHyphenatedString(
    entityType
  )} Name`;

  const runErrorChecks = (name: string) => {
    let validEmail = true;
    let validPassword = true;
    let validEinNumber = true;
    let validEntityName = true;
    let validCity = true;
    let validZip = true;

    if (step === 0) {
      if (name === "email") {
        validEmail = isValidEmail(data.email);
      }
      if (name === "password") {
        validPassword = isGoodEnoughPassword(data.password);
      }
      if (name === "ein") {
        validEinNumber = isValidEINNumber(data.ein);
      }
    }
    if (step === 1) {
      if (name === "zip") {
        validZip = isValidBetaZipCode(data.zip);
      }
      if (name === "organizationName" || name === "nonprofitName") {
        const dataToTest =
          entityType === "organization"
            ? data.organizationName
            : data.nonprofitName;
        validEntityName = isValidEntityName(dataToTest);
      }
      if (name === "city") {
        // Probably fine
        validCity = isValidCity(data.city);
      }
    }

    const anyErrors =
      !validEmail ||
      !validPassword ||
      !validZip ||
      !validEntityName ||
      !validCity;

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
      entityName: !validEntityName,
      city: !validCity,
      einNumber: !validEinNumber,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target as { name: keyof typeof errors };

    runErrorChecks(name);

    updateFormData(e);
  };

  const entityForms = [
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
        placeholder={`${entityType}@email.com`}
        isRequired
      />
      <Inputs
        key={`${step}-password`}
        label="Password"
        darbeInputType="standardInput"
        error={errors.password}
        errorHelperText="Password must be at least 8 characters long"
        value={data.password}
        handleChange={handleChange}
        placeholder=" * * * * *"
        name="password"
        type="password"
        isRequired
      />
      <Inputs
        key={`${step}-ein`}
        label="EIN (Optional)"
        darbeInputType="standardInput"
        error={errors.einNumber}
        value={data.ein}
        errorHelperText="Please enter a valid 9 digit  EIN number"
        handleChange={handleChange}
        placeholder=" ##-#######"
        name="ein"
        isRequired
      />
    </>,
    <>
      <Inputs
        key={`${step}-entityName`}
        label={capitalizedEntityName}
        darbeInputType="standardInput"
        handleChange={handleChange}
        value={data.nonprofitName || data.organizationName}
        error={errors.entityName}
        errorHelperText={`Please enter a valid ${capitalizedEntityName}`}
        name={
          entityType === "organization" ? "organizationName" : "nonprofitName"
        }
        placeholder={capitalizedEntityName}
        isRequired
      />
      <Inputs
        key={`${step}-dob`}
        label="City"
        darbeInputType="standardInput"
        handleChange={handleChange}
        value={data.city}
        error={errors.city}
        errorHelperText="Please enter a valid city"
        name="city"
        placeholder="Houston"
        isRequired
      />
      <Inputs
        key={`${step}-zip`}
        label="Zip Code"
        darbeInputType="standardInput"
        handleChange={handleChange}
        value={data.zip}
        error={errors.zip}
        errorHelperText="Darbe is only available in Houston Houston and surrounding areas at the moment"
        name="zip"
        placeholder="77001"
        isRequired
      />
    </>,
    <>
      <Causes
        isIndividual={false}
        nonUserType={entityType}
        onChange={updateCauseData}
      />
    </>,
  ];

  return <>{entityForms[step]}</>;
};
