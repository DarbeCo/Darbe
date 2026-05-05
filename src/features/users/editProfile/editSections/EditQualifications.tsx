import { IconButton } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { UserLicenses } from "./subSections/UserLicenses";
import { UserSkills } from "./subSections/UserSkills";
import { LicensesModal } from "./subSections/LicensesModal";
import { SkillsModal } from "./subSections/SkillsModal";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectQualifications, selectCurrentUserId } from "../../selectors";
import { isValidArray } from "../../../../utils/CommonFunctions";
import { setModalType } from "../../../../components/modal/modalSlice";
import {
  getModalStatus,
  getModalType,
} from "../../../../components/modal/selectors";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";
import { EDIT_SECTIONS } from "../../userProfiles/constants";


import styles from "../styles/profileEdit.module.css";
import subSectionStyles from "./subSections/styles/subSections.module.css";

type QualificationPanel = "list" | "license" | "skill";

// TODO: The modals here should be combined with the create a post modal to be more generic
export const EditQualifications = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const isModalOpen = useAppSelector(getModalStatus);
  const modalType = useAppSelector(getModalType);
  const { licenses, skills } = useAppSelector(selectQualifications);
  const [activePanel, setActivePanel] = useState<QualificationPanel>("list");
  const [licenseIdToEdit, setLicenseIdToEdit] = useState<string | undefined>();
  const [skillIdToEdit, setSkillIdToEdit] = useState<string | undefined>();

  const hasLicenses = isValidArray(licenses);
  const hasSkills = isValidArray(skills);
  const closeInlinePanel = () => {
    setActivePanel("list");
    setLicenseIdToEdit(undefined);
    setSkillIdToEdit(undefined);
  };

  const showAddLicensePanel = () => {
    setLicenseIdToEdit(undefined);
    setActivePanel("license");
  };

  const showEditLicensePanel = (licenseId: string | undefined) => {
    setLicenseIdToEdit(licenseId);
    setActivePanel("license");
  };

  const showAddSkillPanel = () => {
    setSkillIdToEdit(undefined);
    setActivePanel("skill");
  };

  const showEditSkillPanel = (skillId: string | undefined) => {
    setSkillIdToEdit(skillId);
    setActivePanel("skill");
  };

  const handlePrevious = () => {
    if (isModalOpen && modalType === EDIT_SECTIONS.qualifications) {
      dispatch(setModalType(EDIT_SECTIONS.military));
      return;
    }

    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.military}`);
  };

  if (activePanel === "skill") {
    return (
      <SkillsModal
        closeModal={closeInlinePanel}
        inline
        skillId={skillIdToEdit}
        existingSkills={skills}
        userId={userId}
      />
    );
  }

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileEditDisplaySections}>
          <div className={styles.profileQualifications}>
            <div className={styles.profileQualificationsHeader}>
              <h2 className={styles.profileEditSectionTitle}>Licenses</h2>
              <IconButton onClick={showAddLicensePanel}>
                <CustomSvgs
                  svgPath="/svgs/common/blueAddIcon.svg"
                  altText="Add license"
                  variant="small"
                />
              </IconButton>
            </div>
            {hasLicenses ? (
              <UserLicenses
                licenses={licenses}
                onEditLicense={showEditLicensePanel}
                userId={userId}
              />
            ) : (
              <span className={subSectionStyles.emptyQualificationsText}>
                No licenses to display
              </span>
            )}
          </div>
          <div className={styles.profileQualifications}>
            <div className={styles.profileQualificationsHeader}>
              <h2 className={styles.profileEditSectionTitle}>Skills</h2>
              <IconButton onClick={showAddSkillPanel}>
                <CustomSvgs
                  svgPath="/svgs/common/blueAddIcon.svg"
                  altText="Add skill"
                  variant="small"
                />
              </IconButton>
            </div>
            {hasSkills ? (
              <UserSkills
                onEditSkill={showEditSkillPanel}
                skills={skills}
                userId={userId}
              />
            ) : (
              <span className={subSectionStyles.emptyQualificationsText}>
                No skills to display
              </span>
            )}
          </div>
        </div>

        <div className={styles.profileDialogBottomActions}>
          <DarbeButton
            buttonText="Previous"
            darbeButtonType="secondaryNextButton"
            onClick={handlePrevious}
          />
        </div>
      </div>
      {activePanel === "license" ? (
        <LicensesModal
          closeModal={closeInlinePanel}
          licenseId={licenseIdToEdit}
          existingLicenses={licenses}
          userId={userId}
        />
      ) : null}
    </div>
  );
};
