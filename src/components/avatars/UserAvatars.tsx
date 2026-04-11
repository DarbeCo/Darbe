import { Avatar } from "@mui/material";

import styles from "./styles/darbeAvatar.module.css";
import { useCallback, useMemo } from "react";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { useNavigate } from "react-router-dom";

interface UserAvatarsProps {
  userId?: string;
  fullName?: string;
  profilePicture?: string;
  organizationName?: string;
  nonprofitName?: string;
  variant?: "default" | "small" | "large";
  timeStamp?: string;
  city?: string;
  zip?: string;
  onClick?: () => void;
}

/**
 * A basic avatar display, NOT the logged in user
 */
export const UserAvatars = ({
  variant,
  profilePicture,
  fullName,
  organizationName,
  nonprofitName,
  timeStamp,
  city,
  zip,
  userId,
  onClick,
}: UserAvatarsProps) => {
  const styleVariants = {
    default: styles.avatarDefault,
    small: styles.smallAvatar,
    large: styles.largeAvatar,
  };
  const styleToUse = styleVariants[variant || "default"];
  const nameToUse = fullName || organizationName || nonprofitName || "";

  const navigate = useNavigate();

  const handleFriendClick = useCallback(
    (userId: string | undefined) => {
      if (!userId) return;

      navigate(`${PROFILE_ROUTE}/${userId}`);
    },
    [navigate]
  );

  const showCity = useMemo(() => !!(city && zip), [city, zip]);

  return (
    <div
      onClick={() => onClick?.() || handleFriendClick?.(userId)}
      className={styles.avatarUserDiv}
    >
      <Avatar className={styleToUse} alt="user picture" src={profilePicture} />
      <div className={styles.avatarUserInfo}>
        <span className={styles.avatarUserName}>{nameToUse}</span>
        {showCity && (
          <small style={{ marginLeft: ".75em" }}>
            {city}, {zip}{" "}
          </small>
        )}
        {timeStamp && (
          <span className={styles.avatarTimeStamp}>{timeStamp}</span>
        )}
      </div>
    </div>
  );
};
