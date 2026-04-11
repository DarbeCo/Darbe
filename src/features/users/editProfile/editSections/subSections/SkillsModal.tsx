import { useState } from "react";
import { ClosingIcon } from "../../../../../components/closingIcon/ClosingIcon";
import { Inputs } from "../../../../../components/inputs/Inputs";
import { DarbeButton } from "../../../../../components/buttons/DarbeButton";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useEditSkillsInformation } from "../../hooks";
import { SkillState } from "../../../userProfiles/types";
import { useAppDispatch } from "../../../../../services/hooks";
import { updateUserSkills } from "../../../userSlice";

import styles from "./styles/subSections.module.css";

interface SkillsModalProps {
  closeModal: () => void;
  userId: string | undefined;
  skillId?: string;
}

export const SkillsModal = ({
  closeModal,
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
    const payload = {
      skills: skill ? [skill] : [],
      user: { id: userId },
    };

    const updateUser = await updateUserProfile(payload).unwrap();

    if (updateUser.skills) {
      dispatch(updateUserSkills(updateUser.skills));
    }

    closeModal();
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <div className={styles.modalContentHeader}>
          <ClosingIcon onClick={closeModal} horizontalPlacement="right" />
          <span className={styles.modalHeaderText}>Add Skills</span>
        </div>
        <div className={styles.modalContentForm}>
          <Inputs
            label="Skill Name"
            placeholder="Enter skill name"
            type="text"
            name="skillName"
            darbeInputType="standardInput"
            value={skill?.skillName}
            handleChange={handleChange}
          />
        </div>
        <DarbeButton
          buttonText="Save"
          isDisabled={!skill?.skillName}
          darbeButtonType="saveButton"
          onClick={handleSaveSkill}
        />
      </div>
    </div>
  );
};
