import { IconButton } from "@mui/material";
import { getUserStateFromZip } from "../../utils/CommonFunctions";
import { DarbeAvatar } from "../avatars/DarbeAvatar";

import styles from "./styles/friendSuggestions.module.css";
import { AddCircle } from "@mui/icons-material";

interface AddFriendCard {
  fullName: string;
  city: string;
  zip: string;
  profilePic: string;
}

export const AddFriendCard = ({
  fullName,
  city,
  zip,
  profilePic,
}: AddFriendCard) => {
  const userState = getUserStateFromZip(zip);

  const handleClick = () => {
    // todo: add friend
  };

  return (
    <div className={styles.addFriendCard}>
      <DarbeAvatar overrideProfilePicture={profilePic} />
      <div className={styles.addFriendCardInfo}>
        <span className={styles.addFriendCardName}>{fullName}</span>
        <span className={styles.addFriendCardLocation}>
          {`${city}, ${userState}`}
        </span>
      </div>
      <IconButton onClick={handleClick}>
        <AddCircle />
      </IconButton>
    </div>
  );
};
