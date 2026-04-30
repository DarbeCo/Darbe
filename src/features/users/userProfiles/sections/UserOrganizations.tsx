import { useNavigate } from "react-router-dom";

import { Typography } from "../../../../components/typography/Typography";
import { EDIT_SECTIONS } from "../constants";
import { OrganizationState } from "../types";
import { EditProfileIcon } from "./EditProfileIcon";
import {
  capitalizeFirstLetter,
  formatDateTime,
} from "../../../../utils/CommonFunctions";
import { DATE_CONSTANTS } from "../../../../utils/CommonConstants";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";

import styles from "../styles/userProfiles.module.css";

interface UserOrganizationsProps {
  organizations?: OrganizationState[];
  canEdit: boolean;
}

// TODO: Make the rendered section it's own component later on
export const UserOrganizations = ({
  organizations,
  canEdit,
}: UserOrganizationsProps) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.organizations}`);
  };

  return (
    <div className={styles.userOrganizations}>
      <div className={styles.userOrganizationsHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Organizations"
          extraClass="paddingLeft"
        />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      {organizations?.length === 0 && (
        <div className={styles.blockTextSection}>
          <Typography
            variant="grayText"
            textToDisplay="No organizations found. "
          />
        </div>
      )}
      <div className={styles.userOrganizationsList}>
        {organizations?.map((organization, index) => {
          const formattedStartDate = formatDateTime(
            organization.startDate,
            DATE_CONSTANTS.YEAR_ONLY
          );
          const formattedEndDate = organization.endDate
            ? formatDateTime(organization.endDate, DATE_CONSTANTS.YEAR_ONLY)
            : "Present";

          return (
            // This reuses some styles from the about section for ease of use
            <div key={index} className="paddingLeft paddingBottom">
              <div className={styles.profileRow}>
                <Typography
                  variant="text"
                  textToDisplay={capitalizeFirstLetter(
                    organization?.organizationName
                  )}
                />
                <div className={styles.profileRowDates}>
                  <Typography
                    variant="text"
                    textToDisplay={formattedStartDate}
                  />
                  <span> - </span>
                  <Typography variant="text" textToDisplay={formattedEndDate} />
                </div>
              </div>
              <div className={styles.profileRow}>
                <Typography
                  variant="grayText"
                  textToDisplay={organization.position}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
