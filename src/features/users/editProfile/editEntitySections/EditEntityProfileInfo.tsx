import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { NONPROFIT_TYPES } from "../../../../components/dropdowns/dropdownTypes/NonprofitTypes";
import { getModalStatus } from "../../../../components/modal/selectors";
import { hideModal, setModalType } from "../../../../components/modal/modalSlice";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { formatPhoneNumber } from "../../../../utils/formUtils/formUtils";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { setUserProfile } from "../../userSlice";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
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
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const isModalOpen = useAppSelector(getModalStatus);
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

  const renderNonprofitTypeSelect = () => {
    const value = getFieldValue("nonprofitType");

    return (
      <div
        className={`${styles.profileDialogField} ${styles.profileDialogFieldFullWidth}`.trim()}
      >
        <label className={styles.profileDialogLabel} htmlFor="nonprofitType">
          Nonprofit Type
        </label>
        <select
          id="nonprofitType"
          className={`${styles.profileDialogSelect} ${
            value ? styles.profileDialogFieldFilled : ""
          }`.trim()}
          name="nonprofitType"
          onChange={handleChange}
          value={value}
        >
          <option value="">Update your nonprofit type</option>
          {NONPROFIT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderCausesLink = () => (
    <div className={styles.profileDialogField}>
      <label className={styles.profileDialogLabel} htmlFor="entityCausesLink">
        Causes
      </label>
      <button
        id="entityCausesLink"
        type="button"
        className={styles.profileDialogLinkButton}
        onClick={handleEditCauses}
      >
        Edit Causes
      </button>
    </div>
  );

  const saveProfile = useCallback(async () => {
    const payload = {
      ...editProfileInfo,
      phoneNumber: formatPhoneNumber(editProfileInfo.phoneNumber),
      user: {
        id: userId,
        ein: editProfileInfo.ein,
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

  const handleEditCauses = async () => {
    await saveProfile();

    if (isModalOpen) {
      dispatch(setModalType(EDIT_SECTIONS.causes));
      return;
    }

    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.causes}`);
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
          {entityType === "nonprofit" && renderNonprofitTypeSelect()}
          {renderInput("Tagline", "tagLine", "Update your tagline")}
          {renderInput("EIN", "ein", "Update your EIN")}
          {entityType !== "organization" &&
            renderInput("Address", "address", "Update your address")}
          {renderInput("State", "state", "Update your state")}
          {renderInput("City", "city", "Update your city")}
          {renderInput("Zip", "zip", "Update your zip")}
          {entityType === "nonprofit"
            ? renderCausesLink()
            : renderInput("Phone Number", "phoneNumber", "Update your phone number")}
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
