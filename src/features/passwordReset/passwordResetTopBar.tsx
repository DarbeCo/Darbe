import darbeLogo from "/svgs/common/darbeLogo.svg";
import { assetUrl } from "../../utils/assetUrl";
import { Link } from "react-router-dom";

import styles from "./styles/passwordResetPage.module.css";

export const PasswordResetTopBar = () => {
  return (
    <div className={styles.topBar}>
      <img src={assetUrl(darbeLogo)} alt="Darbe logo" />
      <span className={styles.topBarText}>
        Remember your password?{" "}
        <span className={styles.loginLink}>
          <Link to="/login">Login</Link>
        </span>
      </span>
    </div>
  );
};
