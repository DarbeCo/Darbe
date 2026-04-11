import { useState } from "react";

import { Inputs } from "../../../../components/inputs/Inputs";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { useEditEntityAboutInformation } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { setModalType } from "../../../../components/modal/modalSlice";

import styles from "../styles/profileEdit.module.css";

export const EditEntityAbout = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityAboutState } = useEditEntityAboutInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(editEntityAboutState);

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
    return editProfileInfo.aboutUs !== editEntityAboutState.aboutUs;
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }
    dispatch(setModalType(EDIT_SECTIONS.values));
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Inputs
          label={`About Us`}
          placeholder={`Update your ${capitalizedEntityName} about us section`}
          name="aboutUs"
          value={editProfileInfo.aboutUs}
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
        <DarbeButton
          buttonText="Values"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
