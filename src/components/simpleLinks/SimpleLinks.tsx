import { NavLink } from "react-router-dom";
import {
  ABOUT_DARBE_ROUTE,
  CONTACT_DARBE_ROUTE,
  HELP_DARBE_ROUTE,
  PRIVACY_ROUTE,
} from "../../routes/route.constants";

import styles from "./styles/simpleLinks.module.css";

interface SimpleLinksProps {
  direction: "row" | "column";
}

export const SimpleLinks = ({ direction }: SimpleLinksProps) => {
  const linkStyleDirection =
    direction === "row" ? styles.simpleLinksRow : styles.simpleLinksColumn;

  return (
    <div className={linkStyleDirection}>
      <NavLink to={PRIVACY_ROUTE} style={{ textDecoration: "none" }}>
        <span className={styles.simpleLink}>Privacy Policy</span>
      </NavLink>
      <NavLink to={ABOUT_DARBE_ROUTE} style={{ textDecoration: "none" }}>
        <span className={styles.simpleLink}>About Darbe</span>
      </NavLink>
      <NavLink to={CONTACT_DARBE_ROUTE} style={{ textDecoration: "none" }}>
        <span className={styles.simpleLink}>Contact Us</span>
      </NavLink>
      <NavLink to={HELP_DARBE_ROUTE} style={{ textDecoration: "none" }}>
        <span className={styles.simpleLink}>Help</span>
      </NavLink>
    </div>
  );
};
