import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { MilitaryServiceState } from "../../userProfiles/types";
import {
  EDIT_SECTIONS,
  MILITARY_RANKS,
  MilitaryBranch,
} from "../../userProfiles/constants";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useEditMilitaryInformation } from "../hooks";
import { hideModal } from "../../../../components/modal/modalSlice";
import { selectCurrentUserId } from "../../selectors";
import {
  EDIT_PROFILE_ROUTE,
  PROFILE_ROUTE,
} from "../../../../routes/route.constants";
import { setUserProfile } from "../../userSlice";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";

import styles from "../styles/profileEdit.module.css";

const MILITARY_STATUS_OPTIONS = ["Inactive", "Active", "Reserve", "Veteran"];
const MILITARY_BRANCH_OPTIONS: MilitaryBranch[] = [
  "army",
  "airForce",
  "navy",
  "marines",
  "coastGuard",
  "spaceForce",
];
type MilitarySelectFieldProps = {
  label: string;
  name: string;
  value?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const MilitarySelectField = ({
  label,
  name,
  value = "",
  placeholder,
  options,
  required = false,
  error,
  onChange,
}: MilitarySelectFieldProps) => {
  const textValue = value?.toString() ?? "";

  return (
    <div className={styles.profileDialogField}>
      <label className={styles.profileDialogLabel}>
        {label}
        {required && <span className={styles.profileDialogRequired}>*</span>}
      </label>
      <select
        className={`${styles.profileDialogSelect} ${
          error ? styles.profileDialogFieldError : ""
        } ${
          textValue ? styles.profileDialogFieldFilled : ""
        }`.trim()}
        name={name}
        onChange={onChange}
        value={textValue}
      >
        <option value="" aria-label={placeholder}></option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className={styles.profileDialogFieldMessage}>{error}</p>
      ) : null}
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
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (fieldErrors[name]) {
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }

    setFormData({
      ...formData,
      [name]: value,
      ...(name === "branch" ? { rank: "" } : {}),
    });
  };

  const hasMilitaryFields = () =>
    Boolean(
      formData.branch?.trim() ||
        formData.rank?.trim() ||
        formData.status?.trim()
    );

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!hasMilitaryFields()) {
      return errors;
    }

    if (!formData.branch?.trim()) {
      errors.branch = "Branch Name is required.";
    }

    if (!formData.rank?.trim()) {
      errors.rank = "Rank is required.";
    }

    if (!formData.status?.trim()) {
      errors.status = "Status is required.";
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError("Please fix the required fields.");
      return false;
    }

    setFieldErrors({});
    setSaveError("");

    const payload = {
      militaryService: hasMilitaryFields()
        ? [
            {
              ...formData,
              startDate: formData.startDate ?? new Date().toISOString(),
            },
          ]
        : [],
      user: { id: userId },
    };

    try {
      const updatedUser = await updateUserProfile(payload).unwrap();
      dispatch(setUserProfile(updatedUser));
      dispatch(hideModal());
      return true;
    } catch (error) {
      console.error("Error saving Military", error);
      setSaveError("Unable to save Military. Please try again.");
      return false;
    }
  };

  const isFormDirty = () => {
    return (
      formData.branch !== editMilitaryState.branch ||
      formData.rank !== editMilitaryState.rank ||
      formData.status !== editMilitaryState.status
    );
  };

  const handleSaveAndReturnToProfile = async () => {
    const didSave = await handleSave();

    if (didSave) {
      navigate(`${PROFILE_ROUTE}/${userId}`);
    }
  };

  const handleNextSection = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError("Please fix the required fields.");
      return;
    }

    if (isFormDirty()) {
      const didSave = await handleSave();

      if (!didSave) {
        return;
      }
    }
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.qualifications}`);
  };

  const statusValue = formData.status ?? "";
  const branchValue = formData.branch ?? "";
  const rankOptions = branchValue
    ? MILITARY_RANKS[branchValue as MilitaryBranch].map((rank) => ({
        value: rank,
        label: rank,
      }))
    : [];

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileAboutForm}>
          <h2 className={styles.profileEditSectionTitle}>Military</h2>
          <MilitarySelectField
            name="branch"
            label="Branch Name"
            value={branchValue}
            placeholder="Branch"
            options={MILITARY_BRANCH_OPTIONS.map((branch) => ({
              value: branch,
              label: splitStringndCapitalize(branch, true),
            }))}
            error={fieldErrors.branch}
            onChange={handleDropdownChange}
          />
          <MilitarySelectField
            name="rank"
            label="Rank"
            value={formData.rank}
            placeholder="Rank"
            options={rankOptions}
            error={fieldErrors.rank}
            onChange={handleDropdownChange}
          />
          <MilitarySelectField
            name="status"
            label="Status"
            value={statusValue}
            placeholder="Status"
            options={MILITARY_STATUS_OPTIONS.map((status) => ({
              value: status,
              label: status,
            }))}
            error={fieldErrors.status}
            onChange={handleDropdownChange}
          />
        </div>
      </div>

      {saveError && <p className={styles.profileDialogError}>{saveError}</p>}

      <div className={styles.profileDialogFooter}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSaveAndReturnToProfile}
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
