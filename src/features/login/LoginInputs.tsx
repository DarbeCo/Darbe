import React, { Dispatch, SetStateAction } from "react";
import { LoginState } from "./types";
import { Inputs } from "../../components/inputs/Inputs";

import styles from "./styles/loginPage.module.css";

interface LoginInputsProps {
  handleChange: Dispatch<SetStateAction<LoginState>>;
}

// TODO: Clean this up, new files probs
export const LoginInputs = ({ handleChange }: LoginInputsProps) => {
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <div className={styles.loginInputs}>
      <Inputs
        label="Email"
        darbeInputType="standardInput"
        handleChange={updateFormData}
        name="email"
        type="email"
        placeholder="volunteer@email.com"
        isRequired
      />
      <Inputs
        label="Password"
        darbeInputType="standardInput"
        handleChange={updateFormData}
        placeholder=" * * * * *"
        name="password"
        type="password"
        isRequired
      />
    </div>
  );
};
