import { useEffect, useState } from "react";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { Typography } from "../../../../components/typography/Typography";
import { OrganizationsModal } from "./subSections/OrganizationsModal";
import { SimpleProfileOrganizations } from "./subSections/SimpleProfileOrganizations";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectUserOrganizations, selectCurrentUserId } from "../../selectors";
import { useRemoveUserOrganizationMutationMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserOrganizations } from "../../userSlice";
import { OrganizationState } from "../../userProfiles/types";

import styles from "../styles/profileEdit.module.css";

export const EditOrganizations = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const userOrganizations = useAppSelector(selectUserOrganizations);
  const dispatch = useAppDispatch();
  const [removeOrganization] = useRemoveUserOrganizationMutationMutation();
  const [localOrganizations, setLocalOrganizations] = useState<
    OrganizationState[]
  >([]);
  const hasOrganizatiosn =
    Array.isArray(localOrganizations) && localOrganizations.length > 0;

  const [organizationToEdit, setOrganizationToEdit] = useState<
    string | undefined
  >();
  const [organizationToDelete, setOrganizationToDelete] = useState<
    string | undefined
  >();
  const [isOrganizationFormOpen, setIsOrganizationFormOpen] = useState(false);

  useEffect(() => {
    setLocalOrganizations(userOrganizations ?? []);
  }, [userOrganizations]);

  const deleteOrganization = (id: string | undefined) => {
    setOrganizationToDelete(id);
  };

  const handleConfirmDeleteOrganization = async () => {
    const id = organizationToDelete;

    if (id) {
      const updatedProfile = await removeOrganization(id).unwrap();
      const updatedOrganizations =
        updatedProfile.organizations ?? localOrganizations;
      setLocalOrganizations(updatedOrganizations);
      dispatch(updateUserOrganizations(updatedOrganizations));
      setOrganizationToDelete(undefined);
    }
  };

  const editOrganization = (id: string | undefined) => {
    setOrganizationToEdit(id);
    setIsOrganizationFormOpen(true);
  };

  const handleAddOrganization = () => {
    setOrganizationToEdit(undefined);
    setIsOrganizationFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsOrganizationFormOpen(false);
    setOrganizationToEdit(undefined);
  };

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileOrganizationsPanel}>
          <h2 className={styles.profileEditSectionTitle}>Organization List</h2>
          {hasOrganizatiosn ? (
            <SimpleProfileOrganizations
              handleDelete={deleteOrganization}
              handleEdit={editOrganization}
              organizations={localOrganizations}
            />
          ) : (
            <Typography
              variant="grayText"
              textToDisplay="No organizations to display"
            />
          )}
        </div>

        <div className={styles.profileDialogBottomActions}>
          <DarbeButton
            buttonText="Add Organization"
            darbeButtonType="nextButton"
            onClick={handleAddOrganization}
          />
        </div>
      </div>
      {isOrganizationFormOpen ? (
        <OrganizationsModal
          key={organizationToEdit ?? "new-organization"}
          userId={userId}
          closeModal={handleCloseForm}
          organizationId={organizationToEdit}
        />
      ) : null}
      {organizationToDelete ? (
        <div className={styles.profileOrganizationDeleteOverlay}>
          <div
            className={styles.profileOrganizationDeleteDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="organization-delete-dialog-title"
          >
            <h2
              className={styles.profileOrganizationDeleteTitle}
              id="organization-delete-dialog-title"
            >
              Are you sure you want to end this organization membership?
            </h2>
            <div className={styles.profileOrganizationDeleteActions}>
              <button
                type="button"
                className={styles.profileOrganizationDeleteYesButton}
                onClick={handleConfirmDeleteOrganization}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.profileOrganizationDeleteCancelButton}
                onClick={() => setOrganizationToDelete(undefined)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
