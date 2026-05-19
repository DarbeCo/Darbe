import { useCallback, useEffect, useState } from "react";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { hideModal } from "../../../../components/modal/modalSlice";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { formatPhoneNumber } from "../../../../utils/formUtils/formUtils";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { setUserProfile } from "../../userSlice";
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

  useEffect(() => {
    setEditProfileInfo(editEntityProfileState);
  }, [
    editEntityProfileState.nonprofitName,
    editEntityProfileState.organizationName,
    editEntityProfileState.parentEntity?.id,
    editEntityProfileState.parentEntity?.fullName,
    editEntityProfileState.nonprofitType,
    editEntityProfileState.tagLine,
    editEntityProfileState.ein,
    editEntityProfileState.address,
    editEntityProfileState.state,
    editEntityProfileState.city,
    editEntityProfileState.zip,
    editEntityProfileState.phoneNumber,
    editEntityProfileState.website,
    editEntityProfileState.associatedEntity?.id,
    editEntityProfileState.associatedEntity?.fullName,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({
      ...prev,
      [name]: name === "phoneNumber" ? formatPhoneNumber(value) : value,
    }));
  };

  const getFieldValue = (name: EntityProfileField) => {
    if (name === "parentEntity") {
      const parentEntity = editProfileInfo.parentEntity;

      if (typeof parentEntity === "string") {
        return parentEntity;
      }

      return parentEntity?.fullName ?? "";
    }

    const value = String(editProfileInfo[name] ?? "");
    return name === "phoneNumber" ? formatPhoneNumber(value) : value;
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
          maxLength={name === "phoneNumber" ? 14 : undefined}
          type={name === "phoneNumber" ? "tel" : "text"}
        />
      </div>
    );
  };

  const saveProfile = useCallback(async () => {
    const payload = {
      ...editProfileInfo,
      phoneNumber: formatPhoneNumber(editProfileInfo.phoneNumber),
      user: {
        id: userId,
        nonprofitName: editProfileInfo.nonprofitName,
        organizationName: editProfileInfo.organizationName,
      },
    };

    const updatedProfile = await updateUserProfile(payload).unwrap();
    dispatch(setUserProfile(updatedProfile));
  }, [dispatch, editProfileInfo, updateUserProfile, userId]);

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
