import { useState } from "react";
import { IconButton } from "@mui/material";

import { Typography } from "../../../../components/typography/Typography";
import { useModal } from "../../../../utils/commonHooks/UseModal";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { OrganizationsModal } from "./subSections/OrganizationsModal";
import { SimpleProfileOrganizations } from "./subSections/SimpleProfileOrganizations";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectUserOrganizations, selectCurrentUserId } from "../../selectors";
import { useRemoveUserOrganizationMutationMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserOrganizations } from "../../userSlice";

import styles from "../styles/profileEdit.module.css";

export const EditOrganizations = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const userOrganizations = useAppSelector(selectUserOrganizations);
  const dispatch = useAppDispatch();
  const [removeOrganization] = useRemoveUserOrganizationMutationMutation();
  const hasOrganizatiosn =
    Array.isArray(userOrganizations) && userOrganizations.length > 0;

  const [organizationToEdit, setOrganizationToEdit] = useState<
    string | undefined
  >();

  const {
    isVisible: addOrganizationModal,
    show: showOrganizationModal,
    toggle: hideOrganizationModal,
  } = useModal();

  const deleteOrganization = async (id: string | undefined) => {
    if (id) {
      const updatedUser = await removeOrganization(id).unwrap();

      if (updatedUser.organizations) {
        dispatch(updateUserOrganizations(updatedUser.organizations));
      }
    }
  };

  const editOrganization = (id: string | undefined) => {
    setOrganizationToEdit(id);

    showOrganizationModal();
  };

  const handleCloseModal = () => {
    hideOrganizationModal();
    setOrganizationToEdit(undefined);
  };

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.profileEditDisplaySections}>
        <div className={styles.profileQualifications}>
          <div className={styles.profileQualificationsHeader}>
            <Typography variant="sectionTitle" textToDisplay="Organizations" />
            <IconButton onClick={showOrganizationModal}>
              <CustomSvgs
                svgPath="/svgs/common/blueAddIcon.svg"
                altText="Add license"
                variant="small"
              />
            </IconButton>
          </div>
          {hasOrganizatiosn ? (
            <SimpleProfileOrganizations
              handleDelete={deleteOrganization}
              handleEdit={editOrganization}
              organizations={userOrganizations}
            />
          ) : (
            <Typography
              variant="grayText"
              textToDisplay="No organizations to display"
            />
          )}
        </div>
      </div>

      {addOrganizationModal && (
        <OrganizationsModal
          userId={userId}
          closeModal={handleCloseModal}
          organizationId={organizationToEdit}
        />
      )}
    </div>
  );
};
