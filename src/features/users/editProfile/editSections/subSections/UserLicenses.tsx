import { IconButton } from "@mui/material";
import { Create, RemoveCircleOutlineSharp } from "@mui/icons-material";

import { LicenseState } from "../../../userProfiles/types";
import { useRemoveUserLicenseMutationMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch } from "../../../../../services/hooks";
import { updateUserLicenses } from "../../../userSlice";

import styles from "./styles/subSections.module.css";

interface UserLicensesProps {
  licenses: LicenseState[] | undefined;
  onEditLicense: (licenseId: string | undefined) => void;
  userId: string | undefined;
}

export const UserLicenses = ({
  licenses,
  onEditLicense,
}: UserLicensesProps) => {
  const dispatch = useAppDispatch();
  const [removeLicense] = useRemoveUserLicenseMutationMutation();

  const deleteLicense = async (licenseId: string | undefined) => {
    if (!licenseId) return;

    const updatedUser = await removeLicense(licenseId).unwrap();

    if (updatedUser.licenses) {
      dispatch(updateUserLicenses(updatedUser.licenses));
      return;
    }

    dispatch(
      updateUserLicenses(
        (licenses ?? []).filter((license) => license._id !== licenseId)
      )
    );
  };

  // TODO: This could be another component for better readability and composability
  return (
    <>
      {licenses?.map((license) => {
        const formattedStartDate =
          license.issueDate && new Date(license.issueDate).getFullYear();
        const formattedEndDate =
          license.expirationDate &&
          new Date(license.expirationDate).getFullYear();
        const text = license.licenseName;

        return (
          <div
            className={styles.profileQualificationsDisplay}
            key={license._id ?? text}
          >
            <div className={styles.licenseTextArea}>
              <span className={styles.licenseTitle}>{text}</span>
              {license.licenseIssuer && (
                <span className={styles.licenseMeta}>
                  {license.licenseIssuer}
                </span>
              )}
              {license.issueDate && (
                <span className={styles.licenseMeta}>
                  {formattedStartDate} -{" "}
                  {license.doesNotExpire
                    ? "No Exp Date"
                    : formattedEndDate ?? ""}
                </span>
              )}
            </div>
            <div className={styles.licenseEditIcons}>
              <IconButton onClick={() => onEditLicense(license?._id)}>
                <Create />
              </IconButton>
              <IconButton onClick={() => deleteLicense(license?._id)}>
                <RemoveCircleOutlineSharp sx={{ color: "red" }} />
              </IconButton>
            </div>
          </div>
        );
      })}
    </>
  );
};
