import { useEffect, useState } from "react";

import { useEditOrganizationInformation } from "../../hooks";
import { OrganizationState } from "../../../userProfiles/types";
import { UseDateParser } from "../../../../../utils/commonHooks/UseDateParser";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../../services/hooks";

import styles from "./styles/subSections.module.css";
import { updateUserOrganizations } from "../../../userSlice";
import { selectUserOrganizations } from "../../../selectors";
import { registerProfileEditAutosave } from "../../profileEditAutosave";

interface OrganizationsModalProps {
  closeModal: () => void;
  userId: string;
  organizationId?: string;
  embedded?: boolean;
}

export const OrganizationsModal = ({
  closeModal,
  userId,
  organizationId,
  embedded = false,
}: OrganizationsModalProps) => {
  const dispatch = useAppDispatch();
  const currentOrganizations = useAppSelector(selectUserOrganizations) ?? [];
  const { editOrganizationState } =
    useEditOrganizationInformation(organizationId);

  const [organizationInfo, setOrganizationInfo] = useState<OrganizationState>(
    editOrganizationState
  );

  const { month: startMonth, year: startYear } = UseDateParser(
    organizationInfo.startDate
  );

  const { month: endMonth, year: endYear } = UseDateParser(
    organizationInfo.endDate
  );

  const [organizationDates, setOrganizationDates] = useState({
    startMonth,
    startYear,
    endMonth,
    endYear,
  });
  const [openDateDropdown, setOpenDateDropdown] = useState<
    keyof typeof organizationDates | undefined
  >();
  const [activeMember, setActiveMember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [updateUserProfile] = useUpdateUserProfileMutation();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, index) =>
    (currentYear - index).toString()
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setOrganizationInfo({
      ...organizationInfo,
      [name]: value,
    });
    setFieldErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleDropdownChange = (
    name: keyof typeof organizationDates,
    value: string
  ) => {
    setOrganizationDates({
      ...organizationDates,
      [name]: value,
    });
    if (name === "startMonth" || name === "startYear") {
      setFieldErrors((previous) => ({ ...previous, startDate: "" }));
    }
    if (name === "endMonth" || name === "endYear") {
      setFieldErrors((previous) => ({ ...previous, endDate: "" }));
    }
    setOpenDateDropdown(undefined);
  };

  const validateOrganization = () => {
    const errors: Record<string, string> = {};

    if (!organizationInfo.organizationName?.trim()) {
      errors.organizationName = "Organization Name is required.";
    }

    if (!organizationDates.startMonth || !organizationDates.startYear) {
      errors.startDate = "Start Date is required.";
    }

    if (!organizationDates.endMonth || !organizationDates.endYear) {
      errors.endDate = "End Date is required.";
    }

    if (!organizationInfo.position?.trim()) {
      errors.position = "Position is required.";
    }

    return errors;
  };

  const isOrganizationDirty = () =>
    JSON.stringify(organizationInfo) !== JSON.stringify(editOrganizationState) ||
    organizationDates.startMonth !== startMonth ||
    organizationDates.startYear !== startYear ||
    organizationDates.endMonth !== endMonth ||
    organizationDates.endYear !== endYear;

  const hasOrganizationData = () =>
    Boolean(
      organizationInfo.organizationName?.trim() ||
        organizationInfo.position?.trim() ||
        organizationDates.startMonth ||
        organizationDates.startYear ||
        organizationDates.endMonth ||
        organizationDates.endYear
    );

  // TODO: Util/generificize this
  const prepareSubmission = () => {
    const startString = `${organizationDates.startMonth} ${organizationDates.startYear}`;
    const endString = `${organizationDates.endMonth} ${organizationDates.endYear}`;

    const startDate = isNaN(Date.parse(startString))
      ? undefined
      : new Date(startString);

    let endDate;

    if (organizationDates.endMonth && organizationDates.endYear) {
      endDate = isNaN(Date.parse(endString)) ? undefined : new Date(endString);
    }

    return { startDate, endDate };
  };

  const handleSaveOrganization = async () => {
    const errors = validateOrganization();

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    const { startDate, endDate } = prepareSubmission();

    const formattedOrganizationInfo = {
      ...organizationInfo,
      startDate,
      endDate,
    };

    const formattedOrganizationId =
      formattedOrganizationInfo._id ??
      (formattedOrganizationInfo as typeof formattedOrganizationInfo & {
        id?: string;
      }).id;
    const updatedOrganizations = organizationId
      ? currentOrganizations.map((organization) => {
          const currentOrganizationId =
            organization._id ??
            (organization as typeof organization & { id?: string }).id;

          return currentOrganizationId === organizationId ||
            currentOrganizationId === formattedOrganizationId
            ? formattedOrganizationInfo
            : organization;
        })
      : [...currentOrganizations, formattedOrganizationInfo];

    const payload = {
      organizations: updatedOrganizations,
      user: { id: userId },
    };

    const newOrganization = await updateUserProfile(payload).unwrap();

    if (newOrganization?.organizations) {
      dispatch(updateUserOrganizations(newOrganization.organizations));
    }

    closeModal();
    return true;
  };

  const autosaveOrganization = async () => {
    if (!isOrganizationDirty() || (!organizationId && !hasOrganizationData())) {
      return true;
    }

    try {
      return await handleSaveOrganization();
    } catch (error) {
      console.error("Error autosaving Organization", error);
      return false;
    }
  };

  const handlePreviousOrganization = async () => {
    if (!isOrganizationDirty() || (!organizationId && !hasOrganizationData())) {
      closeModal();
      return;
    }

    await handleSaveOrganization();
  };

  useEffect(() => {
    return registerProfileEditAutosave(autosaveOrganization);
  }, [organizationInfo, organizationDates, currentOrganizations]);

  const renderDateSelect = (
    name: keyof typeof organizationDates,
    value: string | undefined,
    placeholder: string,
    options: string[]
  ) => (
    <div
      className={`${styles.organizationCompactDropdown} ${
        openDateDropdown === name ? styles.organizationCompactDropdownOpen : ""
      } ${
        (name === "startMonth" || name === "startYear") &&
        fieldErrors.startDate
          ? styles.organizationCompactDropdownError
          : ""
      } ${
        (name === "endMonth" || name === "endYear") && fieldErrors.endDate
          ? styles.organizationCompactDropdownError
          : ""
      }`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpenDateDropdown(undefined);
        }
      }}
    >
      <button
        type="button"
        className={`${styles.organizationCompactDropdownButton} ${
          value ? "" : styles.organizationCompactSelectEmpty
        }`}
        onClick={() =>
          setOpenDateDropdown(openDateDropdown === name ? undefined : name)
        }
        aria-haspopup="listbox"
        aria-expanded={openDateDropdown === name}
      >
        <span>{value || placeholder}</span>
        <span
          className={`${styles.organizationCompactDropdownArrow} ${
            openDateDropdown === name
              ? styles.organizationCompactDropdownArrowOpen
              : ""
          }`}
          aria-hidden="true"
        />
      </button>
      {openDateDropdown === name && (
        <div className={styles.organizationCompactDropdownMenu} role="listbox">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={value === option}
              className={`${styles.organizationCompactDropdownOption} ${
                value === option
                  ? styles.organizationCompactDropdownOptionSelected
                  : ""
              }`}
              key={option}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleDropdownChange(name, option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const formContent = (
    <div
      className={
        embedded ? styles.inlineOrganizationForm : styles.organizationDialog
      }
    >
      <div className={styles.organizationFormHeader}>
        <span>{organizationId ? "Edit Organization" : "Add Organization"}</span>
        <button
          type="button"
          className={styles.organizationFormCloseButton}
          onClick={handlePreviousOrganization}
          aria-label="Close organization form"
        >
          &times;
        </button>
      </div>
      <div className={styles.organizationCompactForm}>
        <div className={styles.organizationCompactField}>
          <label>
            Organization Name<span>*</span>
          </label>
          <input
            type="text"
            name="organizationName"
            value={organizationInfo.organizationName ?? ""}
            placeholder="Organization name"
            className={`${styles.organizationCompactInput} ${
              fieldErrors.organizationName ? styles.organizationFieldError : ""
            }`.trim()}
            onChange={handleChange}
          />
          {fieldErrors.organizationName ? (
            <p className={styles.organizationFieldMessage}>
              {fieldErrors.organizationName}
            </p>
          ) : null}
        </div>
        <div className={styles.organizationCompactField}>
          <label>
            Start Date<span>*</span>
          </label>
          <div className={styles.organizationCompactDateRow}>
            {renderDateSelect(
              "startMonth",
              organizationDates.startMonth,
              "Month",
              months
            )}
            {renderDateSelect(
              "startYear",
              organizationDates.startYear,
              "Year",
              years
            )}
          </div>
          {fieldErrors.startDate ? (
            <p className={styles.organizationFieldMessage}>
              {fieldErrors.startDate}
            </p>
          ) : null}
        </div>
        <div className={styles.organizationCompactField}>
          <label>
            End Date<span>*</span>
          </label>
          <div className={styles.organizationCompactDateRow}>
            {renderDateSelect(
              "endMonth",
              organizationDates.endMonth,
              "Month",
              months
            )}
            {renderDateSelect(
              "endYear",
              organizationDates.endYear,
              "Year",
              years
            )}
          </div>
          {fieldErrors.endDate ? (
            <p className={styles.organizationFieldMessage}>
              {fieldErrors.endDate}
            </p>
          ) : null}
        </div>
        <label className={styles.organizationActiveMember}>
          <input
            type="checkbox"
            checked={activeMember}
            onChange={(event) => setActiveMember(event.target.checked)}
          />
          <span>Active Member</span>
        </label>
        <div className={styles.organizationCompactField}>
          <label>
            Position<span>*</span>
          </label>
          <input
            type="text"
            name="position"
            value={organizationInfo.position ?? ""}
            placeholder="President"
            maxLength={300}
            className={`${styles.organizationCompactInput} ${
              fieldErrors.position ? styles.organizationFieldError : ""
            }`.trim()}
            onChange={handleChange}
          />
          {fieldErrors.position ? (
            <p className={styles.organizationFieldMessage}>
              {fieldErrors.position}
            </p>
          ) : null}
          <span className={styles.organizationPositionCounter}>
            {(organizationInfo.position ?? "").length}/300
          </span>
        </div>
      </div>
      <div className={styles.organizationCompactFooter}>
        <button
          type="button"
          className={styles.organizationCompactSave}
          onClick={handlePreviousOrganization}
        >
          Finish
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <div className={styles.modalContainer}>
      {formContent}
    </div>
  );
};
