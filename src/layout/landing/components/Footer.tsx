import instagram from "/svgs/common/blueInstagram.svg";
import facebook from "/svgs/common/blueFacebook.svg";
import linkedin from "/svgs/common/blueLinkedIn.svg";

import styles from "../styles/landingComponents.module.css";

export const Footer = () => {
  return (
    <div className={styles.landingFooter} id="contactUs">
      <div className={styles.footerSocials}>
        <div className={styles.socialMediaIcon}>
          <img src={instagram} alt="instagram" />
        </div>
        <div className={styles.socialMediaIcon}>
          <img src={facebook} alt="facebook" />
        </div>
        <div className={styles.socialMediaIcon}>
          <img src={linkedin} alt="linkedin" />
        </div>
      </div>
      <div className={styles.footerClosingTextArea}>
        <span className={styles.footerClosingText}>
          Still have questions?&nbsp;
          <span className={styles.boldClosingText}>Contact Us.</span>
        </span>
        <span>
          <a href="mailto: info@darbe.co">info@darbe.co</a>
        </span>
      </div>
      <div className={styles.footerLegalLinks}>
        <span className={styles.footerLegalText}>Copyrights 2024 Darbe</span>
        <span className={styles.footerLegalText}>All Rights Reserved</span>
        <span className={styles.footerLegalText}>
          <a href="/privacyPolicy">Privacy Policy</a>
        </span>
      </div>
    </div>
  );
};
