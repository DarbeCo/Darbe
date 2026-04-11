import darbeLogo from "/svgs/common/darbeLogo.svg";

import styles from "./styles/signUpPage.module.css";

export const SignUpTopBar = () => {
  return (
    <div className={styles.signUpTopBar}>
      <img src={darbeLogo} alt="Darbe logo" />
      <span className={styles.signUpTopBarText}>
        Already Registered?{" "}
        <span className={styles.loginLink}>
          <a href="/login">Login</a>
        </span>
      </span>
    </div>
  );
};
