import individuals from "/svgs/common/individuals.svg";
import nonProfits from "/svgs/common/nonProfits.svg";
import organizations from "/svgs/common/organizations.svg";
import useScreenWidthHook from "../../../utils/commonHooks/UseScreenWidth";

import styles from "../styles/landingComponents.module.css";

export const WhoWeServe = () => {
  const { isDesktop } = useScreenWidthHook();

  return (
    <div className={styles.callToAction}>
      <div className={styles.callToActionHeader}>
        <span className={styles.blueActionHeader}>
          A Powerful Platform For All
        </span>
        <span className={styles.actionHeadTitle}>
          We Are The Future Of Philanthropy
        </span>
      </div>
      {!isDesktop && (
        <>
          <div className={styles.callToActionTypes}>
            <div className={styles.callToActionIndividualHeader}>
              <img src={individuals} alt="individuals Svg" />
            </div>
            <div className={styles.callToActionIndividualDescription}>
              <span className={styles.callToActionDescriptionText}>
                Get matched with the causes that you are passionate about and
                share your actual impact with an engaging online social
                community!
              </span>
            </div>
          </div>
          <div className={styles.callToActionTypes}>
            <div className={styles.callToActionIndividualHeader}>
              <img src={nonProfits} alt="Nonprofits Svg" />
            </div>
            <div className={styles.callToActionIndividualDescription}>
              <span className={styles.callToActionDescriptionText}>
                Automatically connect with local volunteers that match your
                mission and events. Easily increase your revenue, volunteer
                pool, and visibility!
              </span>
            </div>
          </div>
          <div className={styles.callToActionTypes}>
            <div className={styles.callToActionIndividualHeader}>
              <img src={organizations} alt="Organization Svg" />
            </div>
            <div className={styles.callToActionIndividualDescription}>
              <span className={styles.callToActionDescriptionText}>
                Manage your organization and highlight your unique philanthropic
                mission. Use our digital platform to build equity and expand
                your network!
              </span>
            </div>
          </div>
        </>
      )}
      {isDesktop && (
        <>
          <div className={styles.desktopAlignment}>
            <div className={styles.callToActionTypes}>
              <div className={styles.callToActionIndividualHeader}>
                <img src={individuals} alt="individuals Svg" />
              </div>
              <div className={styles.callToActionIndividualDescription}>
                <span className={styles.callToActionDescriptionText}>
                  Get matched with the causes that you are passionate about and
                  share your actual impact with an engaging online social
                  community!
                </span>
              </div>
            </div>
            <div className={styles.callToActionTypes}>
              <div className={styles.callToActionIndividualHeader}>
                <img src={nonProfits} alt="Nonprofits Svg" />
              </div>
              <div className={styles.callToActionIndividualDescription}>
                <span className={styles.callToActionDescriptionText}>
                  Automatically connect with local volunteers that match your
                  mission and events. Easily increase your revenue, volunteer
                  pool, and visibility!
                </span>
              </div>
            </div>
            <div className={styles.callToActionTypes}>
              <div className={styles.callToActionIndividualHeader}>
                <img src={organizations} alt="Organization Svg" />
              </div>
              <div className={styles.callToActionIndividualDescription}>
                <span className={styles.callToActionDescriptionText}>
                  Manage your organization and highlight your unique
                  philanthropic mission. Use our digital platform to build
                  equity and expand your network!
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
