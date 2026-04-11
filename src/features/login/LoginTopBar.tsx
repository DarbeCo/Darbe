import darbeLogo from "/svgs/common/darbeLogo.svg";
import { assetUrl } from "../../utils/assetUrl";
import { Link } from "react-router-dom";

import styles from "./styles/loginPage.module.css";

export const LoginTopBar = () => {
  return (
    <div className={styles.loginTopBar}>
      <img src={assetUrl(darbeLogo)} alt="Darbe logo" />
      <span className={styles.loginTopBarText}>
        New to Darbe?{" "}
        <span className={styles.loginLink}>
          <Link to="/signup">Sign up!</Link>
        </span>
      </span>
    </div>
  );
};
