import { useState } from "react";
import { IconButton } from "@mui/material";
import { Create, RemoveCircleOutlineSharp } from "@mui/icons-material";

import { Typography } from "../../../../../components/typography/Typography";
import { SkillState } from "../../../userProfiles/types";
import { useModal } from "../../../../../utils/commonHooks/UseModal";
import { SkillsModal } from "./SkillsModal";
import { useRemoveUserSkillMutationMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch } from "../../../../../services/hooks";

import styles from "./styles/subSections.module.css";
import { updateUserSkills } from "../../../userSlice";

interface UserSkillsProps {
  skills: SkillState[] | undefined;
  userId: string | undefined;
}

export const UserSkills = ({ skills, userId }: UserSkillsProps) => {
  const dispatch = useAppDispatch();
  const [skillToEdit, setSkillToEdit] = useState<string | undefined>();
  const [removeSkill] = useRemoveUserSkillMutationMutation();

  const {
    isVisible: addSkillsModal,
    show: showSkillsModal,
    toggle: hideSkillsModal,
  } = useModal();

  const deleteSkill = async (skillName: string | undefined) => {
    if (skillName) {
      const updatedUser = await removeSkill(skillName).unwrap();

      if (updatedUser.skills) {
        dispatch(updateUserSkills(updatedUser.skills));
      }
    }
  };

  const editSkill = (id: string | undefined) => {
    setSkillToEdit(id);

    showSkillsModal();
  };

  return (
    <>
      {skills?.map((skill) => (
        <div
          key={skill.skillName}
          className={styles.profileQualificationsDisplay}
        >
          <Typography variant="text" textToDisplay={skill.skillName} />
          <div className={styles.licenseEditIcons}>
            <IconButton onClick={() => editSkill(skill._id)}>
              <Create />
            </IconButton>
            <IconButton onClick={() => deleteSkill(skill.skillName)}>
              <RemoveCircleOutlineSharp sx={{ color: "red" }} />
            </IconButton>
          </div>
        </div>
      ))}
      {addSkillsModal && (
        <SkillsModal
          closeModal={hideSkillsModal}
          userId={userId}
          skillId={skillToEdit}
        />
      )}
    </>
  );
};
