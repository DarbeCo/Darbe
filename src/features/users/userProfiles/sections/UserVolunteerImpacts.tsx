import { Typography } from "../../../../components/typography/Typography";

import styles from "../styles/userProfiles.module.css";

export const UserVolunteerImpacts = () => {
  // TODO: use userId to fetch all volunteer experiences and impacts
  // TODO: use expander here as well
  return (
    <div className={styles.userVolunteerImpacts}>
      <Typography
        variant="sectionTitle"
        textToDisplay="Volunteer Experiences & Impacts"
        extraClass="paddingLeft"
      />
      <div className={styles.blockTextSection}>
        <Typography
          variant="grayText"
          textToDisplay="Oops!! No experience or impacts added yet. Once the user has some experiences, it will be added here."
        />
      </div>
    </div>
  );
};
