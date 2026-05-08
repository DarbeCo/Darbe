import { useCallback, useEffect, useState } from "react";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { setModalType } from "../../../../components/modal/modalSlice";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { useEditEntityValuesInformation } from "../hooks";
import { registerProfileEditAutosave } from "../profileEditAutosave";

import styles from "../styles/profileEdit.module.css";

type EntityValuesField = "motto" | "mission" | "values";

export const EditEntityValues = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityValuesState } = useEditEntityValuesInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(editEntityValuesState);

  const [updateUserProfile] = useUpdateEntityProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const isFormDirty = useCallback(() => {
    return (
      editProfileInfo.motto !== editEntityValuesState.motto ||
      editProfileInfo.mission !== editEntityValuesState.mission ||
      editProfileInfo.values !== editEntityValuesState.values
    );
  }, [
    editEntityValuesState.mission,
    editEntityValuesState.motto,
    editEntityValuesState.values,
    editProfileInfo.mission,
    editProfileInfo.motto,
    editProfileInfo.values,
  ]);

  const saveValues = useCallback(async () => {
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
    return registerProfileEditAutosave(saveValues);
  }, [saveValues]);

  const handleSave = async () => {
    await saveValues();
  };

  const handleNextSection = async () => {
    await saveValues();

    dispatch(setModalType(EDIT_SECTIONS.programs));
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);

  const renderTextarea = (
    label: string,
    name: EntityValuesField,
    placeholder: string
  ) => {
    const value = editProfileInfo[name] ?? "";

    return (
      <div
        className={`${styles.profileDialogField} ${styles.profileDialogFieldFullWidth}`}
      >
        <label className={styles.profileDialogLabel} htmlFor={name}>
          {label}
        </label>
        <textarea
          id={name}
          className={`${styles.profileDialogTextarea} ${
            value ? styles.profileDialogFieldFilled : ""
          }`.trim()}
          name={name}
          onChange={handleChange}
          placeholder={placeholder}
          value={value}
        />
      </div>
    );
  };

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogGrid}>
          {renderTextarea(
            "Motto",
            "motto",
            `Update your ${capitalizedEntityName} motto`
          )}
          {renderTextarea(
            "Mission",
            "mission",
            `Update your ${capitalizedEntityName}'s mission`
          )}
          {renderTextarea(
            "Values",
            "values",
            `Update your ${capitalizedEntityName}'s values`
          )}
        </div>

        <div className={styles.profileDialogBottomActions}>
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
    </div>
  );
};
