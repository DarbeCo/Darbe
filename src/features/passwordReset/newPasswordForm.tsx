import React, { Dispatch, SetStateAction } from "react";
import { Inputs } from "../../components/inputs/Inputs";
import { PasswordResetConfirmState } from "./types";
import styles from "./styles/passwordResetPage.module.css";

interface NewPasswordFormProps {
  handleChange: Dispatch<SetStateAction<PasswordResetConfirmState>>;
  values: PasswordResetConfirmState;
}

export const NewPasswordForm = ({ handleChange, values }: NewPasswordFormProps) => {
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <div className={styles.inputs}>
      <Inputs
        label="New Password"
        darbeInputType="standardInput"
        handleChange={updateFormData}
        name="password"
        type="password"
        placeholder="* * * * * * * *"
        value={values.password}
        isRequired
      />
      <Inputs
        label="Confirm New Password"
        darbeInputType="standardInput"
        handleChange={updateFormData}
        name="confirmPassword"
        type="password"
        placeholder="* * * * * * * *"
        value={values.confirmPassword}
        isRequired
      />
    </div>
  );
};
