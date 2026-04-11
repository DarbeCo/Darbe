import { FormSteps } from "../../components/formSteps/FormSteps";
import {
  capitalizeFirstLetter,
  turnNumberIntoString,
} from "../../utils/CommonFunctions";
import styles from "./styles/signUpPage.module.css";

interface SignUpStepsProps {
  step: number;
  entityType: string;
}

export const SignUpSteps = ({ step, entityType }: SignUpStepsProps) => {
  const entityChoice = entityType === "individual" ? "individual" : "entity";
  const stringStep = turnNumberIntoString(step);
  return (
    <div className={styles.signUpSteps}>
      <span className={styles.signUpStepsHeader}>
        {capitalizeFirstLetter(entityType)} Sign Up
      </span>
      <FormSteps
        step={stringStep}
        formName="signup"
        entityType={entityChoice}
      />
    </div>
  );
};
