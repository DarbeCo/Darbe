import { useState } from "react";

import { Inputs } from "../../../../components/inputs/Inputs";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { useEditEntityProgramsInformation } from "../hooks";

import styles from "../styles/profileEdit.module.css";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { hideModal } from "../../../../components/modal/modalSlice";

export const EditEntityPrograms = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityProgramsState } = useEditEntityProgramsInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(
    editEntityProgramsState
  );

  const [updateUserProfile] = useUpdateEntityProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      ...editProfileInfo,
      user: { id: userId },
    };

    await updateUserProfile(payload);

    dispatch(hideModal());
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Inputs
          label="Programs"
          placeholder={`Update your ${capitalizedEntityName}'s programs section`}
          name="programs"
          value={editProfileInfo.programs}
          handleChange={handleChange}
          darbeInputType="textAreaInput"
          isTextArea={true}
        />
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
      </div>
    </div>
  );
};
