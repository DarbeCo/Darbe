import React, { Dispatch, SetStateAction } from "react";
import { Inputs } from "../../components/inputs/Inputs";
import { PasswordResetRequestState } from "./types";

import styles from "./styles/passwordResetPage.module.css";

interface PasswordResetRequestFormProps {
  handleChange: Dispatch<SetStateAction<PasswordResetRequestState>>;
}

export const PasswordResetRequestForm = ({ handleChange }: PasswordResetRequestFormProps) => {
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <div className={styles.inputs}>
      <Inputs
        label="Email"
        darbeInputType="standardInput"
        handleChange={updateFormData}
        name="email"
        type="email"
        placeholder="volunteer@email.com"
        isRequired
      />
    </div>
  );
};
