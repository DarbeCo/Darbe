import { useState } from "react";
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
  const [fieldError, setFieldError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    setSkillName({ skillName: value });
    setFieldError("");
  };

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleSaveSkill = async () => {
    if (!skill?.skillName?.trim()) {
      setFieldError("Skill Name is required.");
      return;
    }

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
        <div className={styles.organizationFormHeader}>
          <span>{skillId ? "Edit Skills" : "Add Skills"}</span>
          <button
            type="button"
            className={styles.organizationFormCloseButton}
            onClick={closeModal}
            aria-label="Close skill form"
          >
            &times;
          </button>
        </div>
      )}
      {inline && (
        <h2 className={styles.inlineQualificationTitle}>
          {skillId ? "Edit Skills" : "Add Skills"}
        </h2>
      )}
      <div className={styles.organizationCompactForm}>
        <div className={styles.organizationCompactField}>
          <label>
            Skill Name<span>*</span>
          </label>
          <input
            className={`${styles.organizationCompactInput} ${
              fieldError ? styles.organizationFieldError : ""
            }`.trim()}
            name="skillName"
            onChange={handleChange}
            placeholder="Search for a skill (ex: Adobe)"
            value={skill?.skillName ?? ""}
          />
          {fieldError ? (
            <p className={styles.organizationFieldMessage}>{fieldError}</p>
          ) : null}
        </div>
        {/* <span className={styles.emptyQualificationsText}>
          {skill?.skillName ? skill.skillName : "No skills to display"}
        </span> */}
      </div>
      <div className={styles.organizationCompactFooter}>
        <button
          type="button"
          className={styles.organizationCompactSave}
          onClick={handleSaveSkill}
        >
          Finish
        </button>
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
      <div className={styles.organizationDialog}>{content}</div>
    </div>
  );
};
