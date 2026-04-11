import { useState } from "react";
import { IconButton } from "@mui/material";
import { Create, RemoveCircleOutlineSharp } from "@mui/icons-material";

import { Typography } from "../../../../../components/typography/Typography";
import { LicenseState } from "../../../userProfiles/types";
import { useModal } from "../../../../../utils/commonHooks/UseModal";
import { useRemoveUserLicenseMutationMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { LicensesModal } from "./LicensesModal";
import { useAppDispatch } from "../../../../../services/hooks";
import { updateUserLicenses } from "../../../userSlice";

import styles from "./styles/subSections.module.css";

interface UserLicensesProps {
  licenses: LicenseState[] | undefined;
  userId: string | undefined;
}

export const UserLicenses = ({ licenses, userId }: UserLicensesProps) => {
  const dispatch = useAppDispatch();
  const [licenseIdToEdit, setLicenseIdToEdit] = useState<string | undefined>();
  const [removeLicense] = useRemoveUserLicenseMutationMutation();
  const {
    isVisible: addLicenseModal,
    show: showLicenseModal,
    toggle: hideLicenseModal,
  } = useModal();

  const deleteLicense = async (licenseId: string | undefined) => {
    if (!licenseId) return;

    const updatedUser = await removeLicense(licenseId).unwrap();

    if (updatedUser.licenses) {
      dispatch(updateUserLicenses(updatedUser.licenses));
    }
  };

  const editLicense = (id: string | undefined) => {
    setLicenseIdToEdit(id);

    showLicenseModal();
  };

  // TODO: This could be another component for better readability and composability
  return (
    <>
      {licenses?.map((license) => {
        const formattedStartDate =
          license.issueDate && new Date(license.issueDate).toLocaleDateString();
        const formattedEndDate =
          license.expirationDate &&
          new Date(license.expirationDate).toLocaleDateString();
        const text = `${license.licenseName} - ${license.licenseIssuer}`;

        return (
          <div className={styles.profileQualificationsDisplay}>
            <div className={styles.licenseTextArea}>
              <Typography textToDisplay={text} variant="text" />
              {license.issueDate && <span>{formattedStartDate}</span>}
              {license.expirationDate && <span>{formattedEndDate}</span>}
            </div>
            <div className={styles.licenseEditIcons}>
              <IconButton onClick={() => editLicense(license?._id)}>
                <Create />
              </IconButton>
              <IconButton onClick={() => deleteLicense(license?._id)}>
                <RemoveCircleOutlineSharp sx={{ color: "red" }} />
              </IconButton>
            </div>
          </div>
        );
      })}
      {addLicenseModal && (
        <LicensesModal
          closeModal={hideLicenseModal}
          userId={userId}
          licenseId={licenseIdToEdit}
        />
      )}
    </>
  );
};
