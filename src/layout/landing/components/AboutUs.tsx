import styles from "../styles/landingComponents.module.css";

export const AboutUs = () => {
  return (
    <div className={styles.aboutUs} id="whatWeDo">
      <div className={styles.aboutUsText}>
        <span className={styles.headerText}>
          The <span className={styles.bolderInnerText}>One-Stop-Shop</span> For
          All Of Your Philantropy Needs
        </span>
        <p className={styles.headerSmallText}>
          We help volunteers, nonprofits, and organizations come together on one
          social networking platform
        </p>
      </div>
    </div>
  );
};
