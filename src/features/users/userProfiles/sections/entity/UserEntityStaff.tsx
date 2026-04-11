import { useNavigate } from "react-router-dom";
import { SimpleUserState } from "../../types";
import {
  EDIT_PROFILE_ROUTE,
  PROFILE_ROUTE,
} from "../../../../../routes/route.constants";
import { EDIT_SECTIONS } from "../../constants";
import { Typography } from "../../../../../components/typography/Typography";
import { EditProfileIcon } from "../EditProfileIcon";
import { UserAvatars } from "../../../../../components/avatars/UserAvatars";

import styles from "./styles/entityDetails.module.css";

interface UserEntityStaffProps {
  canEdit: boolean;
  staff?: SimpleUserState[];
}

export const UserEntityStaff = ({ canEdit, staff }: UserEntityStaffProps) => {
  const navigate = useNavigate();
  const handleEdit = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.staff}`);
  };

  const hasStaff = Array.isArray(staff) && staff.length > 0;

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.entityUserDisplay}>
      <div className={styles.entityDetailsHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Staff"
          extraClass="paddingLeft"
        />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      {hasStaff &&
        staff?.map((user) => (
          <div key={user.id} className={styles.entityUserRow}>
            <UserAvatars
              fullName={user?.fullName}
              profilePicture={user.profilePicture}
              onClick={() => handleClick(user.id)}
            />
          </div>
        ))}
    </div>
  );
};
