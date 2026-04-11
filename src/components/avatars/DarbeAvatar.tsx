import { Avatar, IconButton } from "@mui/material";
import { NavLink } from "react-router-dom";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectUserProfileInformation,
} from "../../features/users/selectors";
import {
  formatDateTime,
  getUserDisplayName,
} from "../../utils/CommonFunctions";
import { DATE_CONSTANTS } from "../../utils/CommonConstants";

import styles from "./styles/darbeAvatar.module.css";
import { Typography } from "../typography/Typography";

interface DarbeAvatarProps {
  variant?: "default" | "small" | "large";
  showUserName?: boolean;
  showTimeStamp?: boolean;
  overrideProfilePicture?: string;
  overrideUser?: string;
  overrideTimeStamp?: Date;
  overrideUserName?: string;
}

// TODO: use the overrideUser string to grab the correct user from the store/api
export const DarbeAvatar = ({
  variant,
  showUserName,
  showTimeStamp,
  overrideProfilePicture,
  overrideUser,
  overrideTimeStamp,
  overrideUserName,
}: DarbeAvatarProps) => {
  const { user } = useSelector(selectUser);
  const userProfile = useSelector(selectUserProfileInformation);
  const userId = user?.id ?? "";
  const navigationIdToUse = overrideUser ?? userId;
  const styleVariants = {
    default: styles.avatarDefault,
    small: styles.smallAvatar,
    large: styles.largeAvatar,
  };
  const styleToUse = styleVariants[variant || "default"];

  // TODO: Make sure we get the right user and the right name, this defaults to YOU
  const userName = getUserDisplayName(userProfile?.user);

  const formattedDateTime = overrideTimeStamp
    ? formatDateTime(overrideTimeStamp, DATE_CONSTANTS.MONTH_AT_TIME)
    : new Date().toLocaleDateString();
  const imageURLtoUse =
    overrideProfilePicture ?? userProfile?.user.profilePicture;

  return (
    <NavLink to={`${PROFILE_ROUTE}/${navigationIdToUse}`}>
      <IconButton>
        <Avatar className={styleToUse} alt="user picture" src={imageURLtoUse} />
        {showUserName && (
          <div className={styles.avatarUserInfo}>
            <Typography
              extraClass={styles.avatarUserName}
              textToDisplay={overrideUserName ?? userName}
              variant="sectionTitle"
              truncationLength={15}
            />
            {showTimeStamp && (
              <span className={styles.avatarTimeStamp}>
                {formattedDateTime}
              </span>
            )}
          </div>
        )}
      </IconButton>
    </NavLink>
  );
};
