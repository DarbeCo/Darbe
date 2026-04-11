import darbeLogo from "/svgs/common/darbeLogo.svg";

import styles from "./styles/loginPage.module.css";

export const LoginTopBar = () => {
  return (
    <div className={styles.loginTopBar}>
      <img src={darbeLogo} alt="Darbe logo" />
      <span className={styles.loginTopBarText}>
        New to Darbe?{" "}
        <span className={styles.loginLink}>
          <a href="/signup">Sign up!</a>
        </span>
      </span>
    </div>
  );
};
