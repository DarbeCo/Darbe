import { useState } from "react";
import { useEditLicenseInformation } from "../../hooks";
import { LicenseState } from "../../../userProfiles/types";
import { UseDateParser } from "../../../../../utils/commonHooks/UseDateParser";
import { prepareLicenseDates } from "../../util";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserLicenses } from "../../../userSlice";
import { useAppDispatch } from "../../../../../services/hooks";

import styles from "./styles/subSections.module.css";

const MONTH_OPTIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const YEAR_OPTIONS = Array.from({ length: 101 }, (_, index) =>
  `${new Date().getFullYear() - index}`
);

interface LicensesProps {
  closeModal: () => void;
  existingLicenses?: LicenseState[];
  inline?: boolean;
  userId: string | undefined;
  licenseId?: string;
}

export const LicensesModal = ({
  closeModal,
  existingLicenses = [],
  inline = false,
  userId,
  licenseId,
}: LicensesProps) => {
  const dispatch = useAppDispatch();
  const { editLicenseState } = useEditLicenseInformation(licenseId);

  const [licenseInfo, setLicenseInfo] =
    useState<LicenseState>(editLicenseState);

  const { month: issueMonth, year: issueYear } = UseDateParser(
    licenseInfo.issueDate
  );

  const { month: expirationMonth, year: expirationYear } = UseDateParser(
    licenseInfo.expirationDate
  );

  const [licenseDates, setLicenseDates] = useState({
    issueMonth: issueMonth,
    issueYear: issueYear,
    expirationMonth: expirationMonth,
    expirationYear: expirationYear,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setLicenseInfo({
      ...licenseInfo,
      [name]: value,
    });
    setFieldErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseInfo({
      ...licenseInfo,
      doesNotExpire: e.target.checked,
    });
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLicenseDates({
      ...licenseDates,
      [e.target.name]: e.target.value,
    });
  };

  const prepareSumission = () => {
    const { issueDate, expirationDate } = prepareLicenseDates(licenseDates);

    return {
      ...licenseInfo,
      issueDate,
      expirationDate: licenseInfo.doesNotExpire ? undefined : expirationDate,
    };
  };

  const handleSaveLicense = async () => {
    if (!licenseInfo.licenseName?.trim()) {
      setFieldErrors({ licenseName: "License Name is required." });
      return;
    }

    setFieldErrors({});
    const preparedLicense = prepareSumission();
    const licenses = licenseId
      ? existingLicenses.map((existingLicense) =>
          existingLicense._id === licenseId ? preparedLicense : existingLicense
        )
      : [...existingLicenses, preparedLicense];

    const payload = {
      licenses,
      user: { id: userId },
    };

    const updatedUser = await updateUserProfile(payload).unwrap();

    if (updatedUser.licenses) {
      dispatch(updateUserLicenses(updatedUser.licenses));
    }

    closeModal();
  };

  const content = (
    <>
      {!inline && (
        <div className={styles.organizationFormHeader}>
          <span>{licenseId ? "Edit Licenses" : "Add Licenses"}</span>
          <button
            type="button"
            className={styles.organizationFormCloseButton}
            onClick={closeModal}
            aria-label="Close license form"
          >
            &times;
          </button>
        </div>
      )}
      {inline && (
        <h2 className={styles.inlineQualificationTitle}>
          {licenseId ? "Edit Licenses" : "Add Licenses"}
        </h2>
      )}
      <div className={styles.organizationCompactForm}>
        <div className={styles.organizationCompactField}>
          <label>
            License Name<span>*</span>
          </label>
          <input
            type="text"
            name="licenseName"
            value={licenseInfo.licenseName ?? ""}
            placeholder="Enter license name"
            className={`${styles.organizationCompactInput} ${
              fieldErrors.licenseName ? styles.organizationFieldError : ""
            }`.trim()}
            onChange={handleChange}
          />
          {fieldErrors.licenseName ? (
            <p className={styles.organizationFieldMessage}>
              {fieldErrors.licenseName}
            </p>
          ) : null}
        </div>
        <div className={styles.organizationCompactField}>
          <label>License Issuer</label>
          <input
            type="text"
            name="licenseIssuer"
            value={licenseInfo.licenseIssuer ?? ""}
            placeholder="Enter license issuer"
            className={styles.organizationCompactInput}
            onChange={handleChange}
          />
        </div>
        <div className={styles.organizationCompactField}>
          <label>Issue Date</label>
          <div className={styles.organizationCompactDateRow}>
            <select
              className={styles.organizationCompactInput}
              name="issueMonth"
              onChange={handleDropdownChange}
              value={licenseDates.issueMonth ?? ""}
            >
              <option value="">Month</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className={styles.organizationCompactInput}
              name="issueYear"
              onChange={handleDropdownChange}
              value={licenseDates.issueYear ?? ""}
            >
              <option value="">Year</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.organizationCompactField}>
          <label>Expiration Date</label>
          <div className={styles.organizationCompactDateRow}>
            <select
              className={styles.organizationCompactInput}
              name="expirationMonth"
              onChange={handleDropdownChange}
              value={licenseDates.expirationMonth ?? ""}
              disabled={Boolean(licenseInfo.doesNotExpire)}
            >
              <option value="">Month</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className={styles.organizationCompactInput}
              name="expirationYear"
              onChange={handleDropdownChange}
              value={licenseDates.expirationYear ?? ""}
              disabled={Boolean(licenseInfo.doesNotExpire)}
            >
              <option value="">Year</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className={styles.organizationActiveMember}>
          <input
            type="checkbox"
            name="doesNotExpire"
            checked={Boolean(licenseInfo.doesNotExpire)}
            onChange={handleCheckboxChange}
          />
          <span>This credential does not expire</span>
        </label>
      </div>
      <div className={styles.organizationCompactFooter}>
        <button
          type="button"
          className={styles.organizationCompactSave}
          onClick={handleSaveLicense}
        >
          Finish
        </button>
      </div>
    </>
  );

  if (inline) {
    return (
      <div className={styles.inlineQualificationFrame}>
        <div className={styles.inlineQualificationScrollArea}>{content}</div>
      </div>
    );
  }

  return (
    <div className={styles.modalContainer}>
      <div className={styles.organizationDialog}>{content}</div>
    </div>
  );
};
