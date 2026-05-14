import { useCallback, useEffect, useState } from "react";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { hideModal } from "../../../../components/modal/modalSlice";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { useEditEntityProfileInformation } from "../hooks";
import { registerProfileEditAutosave } from "../profileEditAutosave";

import styles from "../styles/profileEdit.module.css";

type EntityProfileField =
  | "nonprofitName"
  | "organizationName"
  | "parentEntity"
  | "nonprofitType"
  | "tagLine"
  | "ein"
  | "address"
  | "state"
  | "city"
  | "zip"
  | "phoneNumber"
  | "website";

export const EditEntityProfileInfo = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityProfileState } = useEditEntityProfileInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(
    editEntityProfileState
  );

  const [updateUserProfile] = useUpdateEntityProfileMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const getFieldValue = (name: EntityProfileField) => {
    if (name === "parentEntity") {
      const parentEntity = editProfileInfo.parentEntity;

      if (typeof parentEntity === "string") {
        return parentEntity;
      }

      return parentEntity?.fullName ?? "";
    }

    return String(editProfileInfo[name] ?? "");
  };

  const renderInput = (
    label: string,
    name: EntityProfileField,
    placeholder: string,
    className?: string
  ) => {
    const value = getFieldValue(name);

    return (
      <div className={`${styles.profileDialogField} ${className ?? ""}`.trim()}>
        <label className={styles.profileDialogLabel} htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          className={`${styles.profileDialogInput} ${
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

  const saveProfile = useCallback(async () => {
    const payload = {
      ...editProfileInfo,
      user: {
        id: userId,
        nonprofitName: editProfileInfo.nonprofitName,
        organizationName: editProfileInfo.organizationName,
      },
    };

    await updateUserProfile(payload);
  }, [editProfileInfo, updateUserProfile, userId]);

  useEffect(() => {
    return registerProfileEditAutosave(saveProfile);
  }, [saveProfile]);

  const handleSave = async () => {
    await saveProfile();

    dispatch(hideModal());
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);
  const formNameIdentifier: EntityProfileField =
    entityType === "nonprofit" ? "nonprofitName" : "organizationName";

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogGrid}>
          {renderInput(
            `${capitalizedEntityName} Name`,
            formNameIdentifier,
            `Update your ${capitalizedEntityName} name`,
            styles.profileDialogFieldFullWidth
          )}
          {renderInput(
            `Parent ${capitalizedEntityName}`,
            "parentEntity",
            `Update your parent ${capitalizedEntityName}`,
            styles.profileDialogFieldFullWidth
          )}
          {entityType === "nonprofit" &&
            renderInput(
              "Nonprofit Type",
              "nonprofitType",
              "Update your nonprofit type",
              styles.profileDialogFieldFullWidth
            )}
          {renderInput("Tagline", "tagLine", "Update your tagline")}
          {renderInput("EIN", "ein", "Update your EIN")}
          {renderInput("Address", "address", "Update your address")}
          {renderInput("State", "state", "Update your state")}
          {renderInput("City", "city", "Update your city")}
          {renderInput("Zip", "zip", "Update your zip")}
          {renderInput("Phone Number", "phoneNumber", "Update your phone number")}
          {renderInput("Website", "website", "Update your website")}
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
