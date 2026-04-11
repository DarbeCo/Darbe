import { IconButton } from "@mui/material";
import { Create, RemoveCircleOutlineSharp } from "@mui/icons-material";

import { Typography } from "../../../../../components/typography/Typography";
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
        const startDate = organization.startDate
          ? new Date(organization.startDate).getFullYear()
          : "";
        const endDate = organization.endDate
          ? new Date(organization.endDate).getFullYear()
          : "Present";

        return (
          <div key={idx} className={styles.organizationInfo}>
            <Typography
              variant="grayText"
              textToDisplay={organization.organizationName}
            />
            {organization.parentOrganization && (
              <Typography
                variant="grayText"
                textToDisplay={organization.parentOrganization.organizationName}
              />
            )}
            <div className={styles.organizationYears}>
              <Typography variant="informational" textToDisplay={startDate} />
              {" - "}
              {organization.endDate ? (
                <Typography variant="informational" textToDisplay={endDate} />
              ) : (
                <Typography variant="informational" textToDisplay="Present" />
              )}
            </div>
            <Typography
              variant="informational"
              textToDisplay={organization.position}
            />
            <div className={styles.organizationEditIcons}>
              <IconButton onClick={() => handleEdit(organization._id)}>
                <Create />
              </IconButton>
              <IconButton onClick={() => handleDelete(organization._id)}>
                <RemoveCircleOutlineSharp sx={{ color: "red" }} />
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};
