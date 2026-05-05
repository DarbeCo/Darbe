import { useEffect, useState } from "react";
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
import { setModalType } from "../../../../components/modal/modalSlice";
import {
  getModalStatus,
  getModalType,
} from "../../../../components/modal/selectors";
import { selectCurrentUserId } from "../../selectors";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";
import { setUserProfile } from "../../userSlice";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { registerProfileEditAutosave } from "../profileEditAutosave";

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
        {options?.map((option) => (
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
  const isModalOpen = useAppSelector(getModalStatus);
  const modalType = useAppSelector(getModalType);
  const navigate = useNavigate();
  const { editMilitaryState } = useEditMilitaryInformation();

  const dispatch = useAppDispatch();
  const [formData, setFormData] =
    useState<MilitaryServiceState>(editMilitaryState);
  const [updateUserProfile] = useUpdateUserProfileMutation();
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isMilitaryDialog =
    isModalOpen && modalType === EDIT_SECTIONS.military;

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

  const validateAndPersistMilitary = async () => {
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

  const autosaveMilitary = async () => {
    if (!isFormDirty()) {
      return true;
    }

    return validateAndPersistMilitary();
  };

  useEffect(() => {
    return registerProfileEditAutosave(autosaveMilitary);
  }, [formData]);

  const handlePrevious = async () => {
    const didSave = await autosaveMilitary();

    if (!didSave) {
      return;
    }

    if (isMilitaryDialog) {
      dispatch(setModalType(EDIT_SECTIONS.background));
      return;
    }

    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.background}`);
  };

  const handleNextSection = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError("Please fix the required fields.");
      return;
    }

    if (isFormDirty()) {
      const didSave = await autosaveMilitary();

      if (!didSave) {
        return;
      }
    }

    if (isMilitaryDialog) {
      dispatch(setModalType(EDIT_SECTIONS.qualifications));
      return;
    }

    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.qualifications}`);
  };

  const statusValue = formData.status ?? "";
  const branchValue = formData.branch ?? "";
  const rankOptions = branchValue
    ? MILITARY_RANKS[branchValue as MilitaryBranch]?.map((rank) => ({
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
            options={MILITARY_BRANCH_OPTIONS?.map((branch) => ({
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
            options={MILITARY_STATUS_OPTIONS?.map((status) => ({
              value: status,
              label: status,
            }))}
            error={fieldErrors.status}
            onChange={handleDropdownChange}
          />
        </div>

        {saveError && <p className={styles.profileDialogError}>{saveError}</p>}

        <div className={styles.profileDialogBottomActions}>
          <DarbeButton
            buttonText="Previous"
            darbeButtonType="secondaryNextButton"
            onClick={handlePrevious}
          />
          <DarbeButton
            buttonText="Licenses"
            darbeButtonType="nextButton"
            endingIconPath="/svgs/common/goForwardIconWhite.svg"
            onClick={handleNextSection}
          />
        </div>
      </div>
    </div>
  );
};
