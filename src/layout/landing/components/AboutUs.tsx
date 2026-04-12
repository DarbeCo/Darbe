import { assetUrl } from "../../../utils/assetUrl";
import styles from "../styles/landingComponents.module.css";

export const AboutUs = () => {
  const backgroundImage = `url(${assetUrl("/images/landingImageBackgroundCTA.png")})`;

  return (
    <div
      className={styles.aboutUs}
      id="whatWeDo"
      style={{ ["--landing-cta-image" as string]: backgroundImage }}
    >
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
