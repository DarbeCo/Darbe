import { useCallback, useEffect, useState } from "react";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { setModalType } from "../../../../components/modal/modalSlice";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { useEditEntityAboutInformation } from "../hooks";
import { registerProfileEditAutosave } from "../profileEditAutosave";

import styles from "../styles/profileEdit.module.css";

export const EditEntityAbout = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityAboutState } = useEditEntityAboutInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(editEntityAboutState);

  const [updateUserProfile] = useUpdateEntityProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const isFormDirty = useCallback(() => {
    return editProfileInfo.aboutUs !== editEntityAboutState.aboutUs;
  }, [editEntityAboutState.aboutUs, editProfileInfo.aboutUs]);

  const saveAbout = useCallback(async () => {
    if (!isFormDirty()) {
      return;
    }

    const payload = {
      ...editProfileInfo,
      user: { id: userId },
    };
    await updateUserProfile(payload);
  }, [editProfileInfo, isFormDirty, updateUserProfile, userId]);

  useEffect(() => {
    return registerProfileEditAutosave(saveAbout);
  }, [saveAbout]);

  const handleSave = async () => {
    await saveAbout();
  };

  const handleNextSection = async () => {
    await saveAbout();
    dispatch(setModalType(EDIT_SECTIONS.values));
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);
  const aboutValue = editProfileInfo.aboutUs ?? "";

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogGrid}>
          <div
            className={`${styles.profileDialogField} ${styles.profileDialogFieldFullWidth}`}
          >
            <label className={styles.profileDialogLabel} htmlFor="aboutUs">
              About Us
            </label>
            <textarea
              id="aboutUs"
              className={`${styles.profileDialogTextarea} ${
                aboutValue ? styles.profileDialogFieldFilled : ""
              }`.trim()}
              name="aboutUs"
              onChange={handleChange}
              placeholder={`Update your ${capitalizedEntityName} about us section`}
              value={aboutValue}
            />
          </div>
        </div>

        <div className={styles.profileDialogBottomActions}>
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
    </div>
  );
};
