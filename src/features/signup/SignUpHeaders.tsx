import styles from "./styles/signUpPage.module.css";

export const SignUpHeaders = () => {
  return (
    <div className={styles.signUpHeaders}>
      <span className={styles.signUpBoldText}>Sign up</span>
      <span className={styles.signUpRegularText}>
        Please Select Your Entity
      </span>
    </div>
  );
};
