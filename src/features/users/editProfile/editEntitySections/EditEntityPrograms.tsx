import { useCallback, useEffect, useState } from "react";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { hideModal } from "../../../../components/modal/modalSlice";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { useEditEntityProgramsInformation } from "../hooks";
import { registerProfileEditAutosave } from "../profileEditAutosave";

import styles from "../styles/profileEdit.module.css";

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const savePrograms = useCallback(async () => {
    const payload = {
      ...editProfileInfo,
      user: { id: userId },
    };

    await updateUserProfile(payload);
  }, [editProfileInfo, updateUserProfile, userId]);

  useEffect(() => {
    return registerProfileEditAutosave(savePrograms);
  }, [savePrograms]);

  const handleSave = async () => {
    await savePrograms();

    dispatch(hideModal());
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);
  const programsValue = editProfileInfo.programs ?? "";

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogGrid}>
          <div
            className={`${styles.profileDialogField} ${styles.profileDialogFieldFullWidth}`}
          >
            <label className={styles.profileDialogLabel} htmlFor="programs">
              Programs
            </label>
            <textarea
              id="programs"
              className={`${styles.profileDialogTextarea} ${
                programsValue ? styles.profileDialogFieldFilled : ""
              }`.trim()}
              name="programs"
              onChange={handleChange}
              placeholder={`Update your ${capitalizedEntityName}'s programs section`}
              value={programsValue}
            />
          </div>
        </div>

        <div className={styles.profileDialogBottomActions}>
          <DarbeButton
            buttonText="Save"
            darbeButtonType="saveButton"
            onClick={handleSave}
          />
        </div>
      </div>
    </div>
  );
};
