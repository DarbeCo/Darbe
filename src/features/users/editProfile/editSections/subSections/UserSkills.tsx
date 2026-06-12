import { IconButton } from "@mui/material";
import { Create, RemoveCircleOutlineSharp } from "@mui/icons-material";
import { useState } from "react";

import { SkillState } from "../../../userProfiles/types";
import { useRemoveUserSkillMutationMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch } from "../../../../../services/hooks";
import { ConfirmDialog } from "../../../../../components/confirmDialog/ConfirmDialog";

import styles from "./styles/subSections.module.css";
import { updateUserSkills } from "../../../userSlice";

interface UserSkillsProps {
  onEditSkill: (skillId: string | undefined) => void;
  skills: SkillState[] | undefined;
  userId: string | undefined;
}

export const UserSkills = ({ onEditSkill, skills }: UserSkillsProps) => {
  const dispatch = useAppDispatch();
  const [removeSkill] = useRemoveUserSkillMutationMutation();
  const [skillToDelete, setSkillToDelete] = useState<string | undefined>();

  const deleteSkill = async (skillName: string | undefined) => {
    if (!skillName) return;

    const updatedUser = await removeSkill(skillName).unwrap();

    if (updatedUser.skills) {
      dispatch(updateUserSkills(updatedUser.skills));
      setSkillToDelete(undefined);
      return;
    }

    dispatch(
      updateUserSkills(
        (skills ?? []).filter((skill) => skill.skillName !== skillName)
      )
    );
    setSkillToDelete(undefined);
  };

  return (
    <>
      {skills?.map((skill) => (
        <div
          key={skill.skillName}
          className={styles.profileQualificationsDisplay}
        >
          <span className={styles.licenseTitle}>{skill.skillName}</span>
          <div className={styles.licenseEditIcons}>
            <IconButton onClick={() => onEditSkill(skill._id)}>
              <Create />
            </IconButton>
            <IconButton onClick={() => setSkillToDelete(skill.skillName)}>
              <RemoveCircleOutlineSharp sx={{ color: "red" }} />
            </IconButton>
          </div>
        </div>
      ))}
      {skillToDelete && (
        <ConfirmDialog
          title={`Remove ${skillToDelete}?`}
          message="This will remove it from your skills."
          confirmLabel="Remove"
          onConfirm={() => deleteSkill(skillToDelete)}
          onCancel={() => setSkillToDelete(undefined)}
        />
      )}
    </>
  );
};
