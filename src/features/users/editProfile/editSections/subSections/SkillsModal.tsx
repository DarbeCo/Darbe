import { useState } from "react";
import { ClosingIcon } from "../../../../../components/closingIcon/ClosingIcon";
import { DarbeButton } from "../../../../../components/buttons/DarbeButton";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useEditSkillsInformation } from "../../hooks";
import { SkillState } from "../../../userProfiles/types";
import { useAppDispatch } from "../../../../../services/hooks";
import { updateUserSkills } from "../../../userSlice";

import styles from "./styles/subSections.module.css";

interface SkillsModalProps {
  closeModal: () => void;
  existingSkills?: SkillState[];
  inline?: boolean;
  userId: string | undefined;
  skillId?: string;
}

export const SkillsModal = ({
  closeModal,
  existingSkills = [],
  inline = false,
  userId,
  skillId,
}: SkillsModalProps) => {
  const dispatch = useAppDispatch();
  const { editSkillState } = useEditSkillsInformation(skillId);
  const [skill, setSkillName] = useState<SkillState | undefined>(
    editSkillState
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    setSkillName({ skillName: value });
  };

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleSaveSkill = async () => {
    if (!skill?.skillName?.trim()) return;

    const preparedSkill = {
      ...skill,
      skillName: skill.skillName.trim(),
    };
    const skills = skillId
      ? existingSkills.map((existingSkill) =>
          existingSkill._id === skillId ? preparedSkill : existingSkill
        )
      : [...existingSkills, preparedSkill];

    const payload = {
      skills,
      user: { id: userId },
    };

    const updateUser = await updateUserProfile(payload).unwrap();

    if (updateUser.skills) {
      dispatch(updateUserSkills(updateUser.skills));
    }

    closeModal();
  };

  const content = (
    <>
      {!inline && (
        <div className={styles.modalContentHeader}>
          <ClosingIcon onClick={closeModal} horizontalPlacement="right" />
          <span className={styles.modalHeaderText}>Add Skills</span>
        </div>
      )}
      {inline && (
        <h2 className={styles.inlineQualificationTitle}>
          {skillId ? "Edit Skills" : "Add Skills"}
        </h2>
      )}
      <div className={styles.skillSearchField}>
        <span aria-hidden="true" className={styles.skillSearchIcon} />
        <input
          className={styles.skillSearchInput}
          name="skillName"
          onChange={handleChange}
          placeholder="Search for a skill (ex: Adobe)"
          value={skill?.skillName ?? ""}
        />
      </div>
      <span className={styles.emptyQualificationsText}>
        {skill?.skillName ? skill.skillName : "No skills to display"}
      </span>
      <div className={styles.inlineQualificationFooter}>
        {inline && (
          <DarbeButton
            buttonText="Cancel"
            darbeButtonType="secondaryButton"
            onClick={closeModal}
          />
        )}
        <DarbeButton
          buttonText="Save"
          isDisabled={!skill?.skillName}
          darbeButtonType="saveButton"
          onClick={handleSaveSkill}
        />
      </div>
    </>
  );

  if (inline) {
    return (
      <div className={styles.inlineQualificationFrame}>
        <div className={styles.inlineQualificationScrollArea}>{content}</div>
      </div>
    );
  }

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        {content}
      </div>
    </div>
  );
};
