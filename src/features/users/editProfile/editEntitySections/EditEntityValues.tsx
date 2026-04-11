import { useState } from "react";

import { Inputs } from "../../../../components/inputs/Inputs";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { useEditEntityValuesInformation } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { setModalType } from "../../../../components/modal/modalSlice";

import styles from "../styles/profileEdit.module.css";

export const EditEntityValues = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityValuesState } = useEditEntityValuesInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(editEntityValuesState);

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
  };

  const isFormDirty = () => {
    return editProfileInfo !== editEntityValuesState;
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }

    dispatch(setModalType(EDIT_SECTIONS.programs));
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Inputs
          label="Motto"
          placeholder={`Update your ${capitalizedEntityName} motto`}
          name="motto"
          value={editProfileInfo.motto}
          handleChange={handleChange}
          darbeInputType="textAreaInput"
        />
        <Inputs
          label="Mission"
          placeholder={`Update your ${capitalizedEntityName}'s mission`}
          name="mission"
          value={editProfileInfo.mission}
          handleChange={handleChange}
          darbeInputType="textAreaInput"
        />
        <Inputs
          label="Values"
          placeholder={`Update your ${capitalizedEntityName}'s values`}
          name="values"
          value={editProfileInfo.values}
          handleChange={handleChange}
          darbeInputType="textAreaInput"
        />
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        <DarbeButton
          buttonText="Programs"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
