import { useNavigate } from "react-router-dom";
import { SimpleUserState } from "../../types";
import {
  EDIT_PROFILE_ROUTE,
  PROFILE_ROUTE,
} from "../../../../../routes/route.constants";
import { EDIT_SECTIONS } from "../../constants";
import { Typography } from "../../../../../components/typography/Typography";
import { EditProfileIcon } from "../EditProfileIcon";
import { isValidArray } from "../../../../../utils/CommonFunctions";

import styles from "./styles/entityDetails.module.css";
import { UserAvatars } from "../../../../../components/avatars/UserAvatars";

interface UserDonorsProps {
  canEdit: boolean;
  donors?: SimpleUserState[];
}

export const UserDonors = ({ canEdit, donors }: UserDonorsProps) => {
  const navigate = useNavigate();
  const handleEdit = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.donors}`);
  };

  const hasDonors = isValidArray(donors);

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.entityUserDisplay}>
      <div className={styles.entityDetailsHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Donors"
          extraClass="paddingLeft"
        />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      {hasDonors &&
        donors?.map((user) => (
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
