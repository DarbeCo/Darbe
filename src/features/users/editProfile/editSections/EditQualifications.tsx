import { IconButton } from "@mui/material";

import { Typography } from "../../../../components/typography/Typography";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { useModal } from "../../../../utils/commonHooks/UseModal";
import { UserLicenses } from "./subSections/UserLicenses";
import { UserSkills } from "./subSections/UserSkills";
import { LicensesModal } from "./subSections/LicensesModal";
import { SkillsModal } from "./subSections/SkillsModal";
import { useAppSelector } from "../../../../services/hooks";
import { selectQualifications, selectCurrentUserId } from "../../selectors";
import { isValidArray } from "../../../../utils/CommonFunctions";


import styles from "../styles/profileEdit.module.css";

// TODO: The modals here should be combined with the create a post modal to be more generic
export const EditQualifications = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const { licenses, skills } = useAppSelector(selectQualifications);

  const {
    isVisible: addSkillsModal,
    show: showAddLicenseModal,
    toggle: hideAddSkillsModal,
  } = useModal();
  const {
    isVisible: addLicenseModal,
    show: showAddSkillsModal,
    toggle: hideAddLicenseModal,
  } = useModal();

  const hasLicenses = isValidArray(licenses);
  const hasSkills = isValidArray(skills);

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.profileEditDisplaySections}>
        <div className={styles.profileQualifications}>
          <div className={styles.profileQualificationsHeader}>
            <Typography variant="sectionTitle" textToDisplay="Licenses" />
            <IconButton onClick={showAddSkillsModal}>
              <CustomSvgs
                svgPath="/svgs/common/blueAddIcon.svg"
                altText="Add license"
                variant="small"
              />
            </IconButton>
          </div>
          {hasLicenses ? (
            <UserLicenses licenses={licenses} userId={userId} />
          ) : (
            <Typography
              variant="grayText"
              textToDisplay="No licenses to display"
            />
          )}
        </div>
        <div className={styles.profileQualifications}>
          <div className={styles.profileQualificationsHeader}>
            <Typography variant="sectionTitle" textToDisplay="Skills" />
            <IconButton onClick={showAddLicenseModal}>
              <CustomSvgs
                svgPath="/svgs/common/blueAddIcon.svg"
                altText="Add license"
                variant="small"
              />
            </IconButton>
          </div>
          {hasSkills ? (
            <UserSkills skills={skills} userId={userId} />
          ) : (
            <Typography
              variant="grayText"
              textToDisplay="No skills to display"
            />
          )}
        </div>
      </div>

      {addLicenseModal && (
        <LicensesModal closeModal={hideAddLicenseModal} userId={userId} />
      )}
      {addSkillsModal && (
        <SkillsModal closeModal={hideAddSkillsModal} userId={userId} />
      )}
    </div>
  );
};
