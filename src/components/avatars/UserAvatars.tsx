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
  subText?: string;
  city?: string;
  zip?: string;
  onClick?: () => void;
  className?: string;
  infoClassName?: string;
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
  subText,
  city,
  zip,
  userId,
  onClick,
  className,
  infoClassName,
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

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }

    handleFriendClick?.(userId);
  }, [handleFriendClick, onClick, userId]);

  return (
    <div onClick={handleClick} className={`${styles.avatarUserDiv} ${className ?? ""}`}>
      <Avatar className={styleToUse} alt="user picture" src={profilePicture} />
      <div className={`${styles.avatarUserInfo} ${infoClassName ?? ""}`}>
        <span className={styles.avatarUserName}>{nameToUse}</span>
        {showCity && (
          <small style={{ marginLeft: ".75em" }}>
            {city}, {zip}{" "}
          </small>
        )}
        {timeStamp && (
          <span className={styles.avatarTimeStamp}>{timeStamp}</span>
        )}
        {subText && <span className={styles.avatarSubText}>{subText}</span>}
      </div>
    </div>
  );
};
