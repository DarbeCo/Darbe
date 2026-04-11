import React, { Dispatch, SetStateAction } from "react";
import { SignUpState } from "./types";
import { DayOfWeek } from "../../services/types/availability.types";
import { UserInputs } from "./userSignUpInputs/UserInputs";
import { EntityInputs } from "./userSignUpInputs/EntityInputs";

import styles from "./styles/signUpPage.module.css";

interface SignUpInputsProps {
  step: number;
  entityType: string;
  data: SignUpState;
  handleChange: Dispatch<SetStateAction<SignUpState>>;
  markError: (hasError: boolean) => void;
}

export const SignUpInputs = ({
  step,
  data,
  entityType,
  handleChange,
  markError,
}: SignUpInputsProps) => {
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange((prevState) => ({ ...prevState, [name]: value }));
  };

  const updateCauseData = (evt: React.MouseEvent<HTMLButtonElement>) => {
    const { textContent } = evt.target as HTMLButtonElement;

    if (!textContent) return;

    handleChange((prevState) => {
      const isAlreadySelected = prevState.causes.includes(textContent);
      if (isAlreadySelected) {
        return {
          ...prevState,
          causes: prevState.causes.filter((cause) => cause !== textContent),
        };
      } else {
        return {
          ...prevState,
          causes: [...prevState.causes, textContent],
        };
      }
    });
  };

  const updateDropdownData = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleChange((prevState) => ({
      ...prevState,
      dob: { ...prevState.dob, [name]: value },
    }));
  };

  const updateAvailabilityData = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const dayOfWeek = name.split(" ")[1];
    const category = name.split(" ")[2];

    handleChange((prevState) => {
      const { availability } = prevState;
      return {
        ...prevState,
        availability: {
          ...availability,
          [dayOfWeek as DayOfWeek]: {
            ...availability?.[dayOfWeek as DayOfWeek],
            [category]: value,
          },
        },
      };
    });
  };

  const updateAvailabilityCheckbox = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = e.target;
    const dayOfWeek = name.split(" ")[1];
    handleChange((prevState) => {
      const { availability } = prevState;
      return {
        ...prevState,
        availability: {
          ...availability,
          [dayOfWeek as DayOfWeek]: {
            ...availability?.[dayOfWeek as DayOfWeek],
            open: checked,
          },
        },
      };
    });
  };

  return (
    <div className={styles.signUpInputs}>
      {entityType === "individual" ? (
        <UserInputs
          step={step - 1}
          data={data}
          updateFormData={updateFormData}
          updateCauseData={updateCauseData}
          updateDropdownData={updateDropdownData}
          updateAvailabilityData={updateAvailabilityData}
          updateAvailabilityCheckbox={updateAvailabilityCheckbox}
          markError={markError}
        />
      ) : (
        <EntityInputs
          entityType={entityType}
          step={step - 2}
          data={data}
          updateFormData={updateFormData}
          updateCauseData={updateCauseData}
          markError={markError}
        />
      )}
    </div>
  );
};
