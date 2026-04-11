import darbeLogo from "/svgs/common/darbeLogo.svg";
import { assetUrl } from "../../utils/assetUrl";
import { Link } from "react-router-dom";

import styles from "./styles/signUpPage.module.css";

export const SignUpTopBar = () => {
  return (
    <div className={styles.signUpTopBar}>
      <img src={assetUrl(darbeLogo)} alt="Darbe logo" />
      <span className={styles.signUpTopBarText}>
        Already Registered?{" "}
        <span className={styles.loginLink}>
          <Link to="/login">Login</Link>
        </span>
      </span>
    </div>
  );
};
