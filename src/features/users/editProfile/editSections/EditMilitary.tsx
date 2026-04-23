import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { MilitaryServiceState } from "../../userProfiles/types";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useEditMilitaryInformation } from "../hooks";
import { hideModal } from "../../../../components/modal/modalSlice";
import { selectCurrentUserId } from "../../selectors";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";

import styles from "../styles/profileEdit.module.css";

const MILITARY_STATUS_OPTIONS = ["Inactive", "Active", "Reserve", "Veteran"];
const MILITARY_TEXT_MAX_LENGTH = 300;

type MilitaryTextFieldProps = {
  label: string;
  name: string;
  value?: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type MilitarySelectFieldProps = {
  label: string;
  name: string;
  value?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  showCounter?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const MilitaryTextField = ({
  label,
  name,
  value = "",
  placeholder,
  onChange,
}: MilitaryTextFieldProps) => {
  const textValue = value?.toString() ?? "";

  return (
    <div className={styles.profileDialogField}>
      <label className={styles.profileDialogLabel}>
        {label}
        <span className={styles.profileDialogRequired}>*</span>
      </label>
      <input
        className={`${styles.profileDialogInput} ${
          textValue ? styles.profileDialogFieldFilled : ""
        }`.trim()}
        maxLength={MILITARY_TEXT_MAX_LENGTH}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        value={textValue}
      />
      <div className={styles.profileDialogCounter}>
        {textValue.length}/{MILITARY_TEXT_MAX_LENGTH}
      </div>
    </div>
  );
};

const MilitarySelectField = ({
  label,
  name,
  value = "",
  placeholder,
  options,
  showCounter = false,
  onChange,
}: MilitarySelectFieldProps) => {
  const textValue = value?.toString() ?? "";

  return (
    <div className={styles.profileDialogField}>
      <label className={styles.profileDialogLabel}>
        {label}
        <span className={styles.profileDialogRequired}>*</span>
      </label>
      <select
        className={`${styles.profileDialogSelect} ${
          textValue ? styles.profileDialogFieldFilled : ""
        }`.trim()}
        name={name}
        onChange={onChange}
        value={textValue}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {showCounter && (
        <div className={styles.profileDialogCounter}>
          {textValue.length}/{MILITARY_TEXT_MAX_LENGTH}
        </div>
      )}
    </div>
  );
};

export const EditMilitary = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const navigate = useNavigate();
  const { editMilitaryState } = useEditMilitaryInformation();

  const dispatch = useAppDispatch();
  const [formData, setFormData] =
    useState<MilitaryServiceState>(editMilitaryState);
  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    const payload = {
      militaryService: [formData],
      user: { id: userId },
    };

    updateUserProfile(payload);
    dispatch(hideModal());
  };

  const isFormDirty = () => {
    return (
      formData.branch !== editMilitaryState.branch ||
      formData.rank !== editMilitaryState.rank ||
      formData.status !== editMilitaryState.status
    );
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.qualifications}`);
  };

  const statusValue = formData.status ?? "";
  const branchValue = formData.branch ?? "";

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileAboutForm}>
          <h2 className={styles.profileEditSectionTitle}>Military</h2>
          <MilitaryTextField
            name="branch"
            label="Branch Name"
            value={branchValue}
            placeholder="Where did you serve?"
            onChange={handleTextChange}
          />
          <MilitaryTextField
            name="rank"
            label="Rank"
            value={formData.rank}
            placeholder="What did you serve?"
            onChange={handleTextChange}
          />
          <MilitarySelectField
            name="status"
            label="Status"
            value={statusValue}
            placeholder="Inactive"
            options={MILITARY_STATUS_OPTIONS.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={handleDropdownChange}
          />
        </div>
      </div>

      <div className={styles.profileDialogFooter}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        <DarbeButton
          buttonText="Licenses"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
