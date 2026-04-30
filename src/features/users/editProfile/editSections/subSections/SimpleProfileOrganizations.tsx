import { Create } from "@mui/icons-material";
import { IconButton } from "@mui/material";

import { OrganizationState } from "../../../userProfiles/types";

import styles from "./styles/subSections.module.css";

interface SimpleProfileOrganizationsProps {
  organizations: OrganizationState[];
  handleEdit: (id: string | undefined) => void;
  handleDelete: (id: string | undefined) => void;
}

export const SimpleProfileOrganizations = ({
  organizations,
  handleEdit,
  handleDelete,
}: SimpleProfileOrganizationsProps) => {
  return (
    <div className={styles.simpleOrganizationsLayout}>
      {organizations.map((organization, idx) => {
        const organizationId =
          organization._id ??
          (organization as typeof organization & { id?: string }).id;
        const parentOrganizationName =
          organization.parentOrganization?.organizationName;

        return (
          <div key={idx} className={styles.organizationInfo}>
            <div className={styles.organizationText}>
              <span className={styles.organizationName}>
                {organization.organizationName}
              </span>
              {parentOrganizationName && (
                <span className={styles.organizationParentName}>
                  {parentOrganizationName}
                </span>
              )}
              <span className={styles.organizationPosition}>
                {organization.position}
              </span>
            </div>
            <div className={styles.organizationEditIcons}>
              <IconButton
                onClick={() => handleEdit(organizationId)}
                aria-label="Edit organization"
              >
                <Create />
              </IconButton>
              <IconButton
                className={styles.organizationDeleteButton}
                onClick={() => handleDelete(organizationId)}
                aria-label="Delete organization"
              >
                <span className={styles.organizationDeleteIcon} aria-hidden="true">
                  <span />
                </span>
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};
