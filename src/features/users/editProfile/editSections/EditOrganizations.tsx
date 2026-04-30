import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ClosingIcon } from "../../../../components/closingIcon/ClosingIcon";
import { Typography } from "../../../../components/typography/Typography";
import { OrganizationsModal } from "./subSections/OrganizationsModal";
import { SimpleProfileOrganizations } from "./subSections/SimpleProfileOrganizations";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectUserOrganizations, selectCurrentUserId } from "../../selectors";
import { useRemoveUserOrganizationMutationMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserOrganizations } from "../../userSlice";
import { PROFILE_ROUTE } from "../../../../routes/route.constants";
import { OrganizationState } from "../../userProfiles/types";

import styles from "../styles/profileEdit.module.css";

export const EditOrganizations = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const navigate = useNavigate();
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
      await removeOrganization(id).unwrap();
      const updatedOrganizations = localOrganizations.filter(
        (organization) =>
          organization._id !== id &&
          (organization as typeof organization & { id?: string }).id !== id
      );
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

  const handleSave = () => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div
      className={`${styles.profileEditContentOrganizations} ${
        isOrganizationFormOpen ? styles.profileEditContentOrganizationForm : ""
      }`}
    >
      <div
        className={`${styles.profileEditOrganizationsScrollArea} ${
          isOrganizationFormOpen
            ? styles.profileEditOrganizationsScrollAreaForm
            : ""
        }`}
      >
        <div
          className={`${styles.profileOrganizationsPanel} ${
            isOrganizationFormOpen ? styles.profileOrganizationsPanelForm : ""
          }`}
        >
          {!isOrganizationFormOpen ? (
            <div className={styles.profileOrganizationListHeader}>
              <span className={styles.profileOrganizationListHeaderTitle}>
                Organization List
              </span>
              <div className={styles.profileOrganizationListClose}>
                <ClosingIcon useNoSx onClick={handleSave} />
              </div>
            </div>
          ) : null}
          {isOrganizationFormOpen ? (
            <OrganizationsModal
              key={organizationToEdit ?? "new-organization"}
              userId={userId}
              closeModal={handleCloseForm}
              organizationId={organizationToEdit}
              embedded
            />
          ) : hasOrganizatiosn ? (
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
      </div>
      {!isOrganizationFormOpen ? (
        <div className={styles.profileOrganizationsFooter}>
          <button
            type="button"
            className={styles.profileOrganizationsAddButton}
            onClick={handleAddOrganization}
          >
            Add Organization
          </button>
          <button
            type="button"
            className={styles.profileOrganizationsSaveButton}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
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
              Are you sure you want to remove this organization?
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
