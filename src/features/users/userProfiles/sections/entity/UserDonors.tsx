import { useState } from "react";
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

const COLLAPSED_COUNT = 5;

const AddIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
    <line
      x1="5.625"
      y1="11.75"
      x2="17.625"
      y2="11.75"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="12.25"
      y1="6.10254"
      x2="12.25"
      y2="18.1025"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export const UserDonors = ({ canEdit, donors }: UserDonorsProps) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const handleEdit = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.donors}`);
  };

  const hasDonors = isValidArray(donors);
  const visibleDonors = showAll
    ? donors ?? []
    : (donors ?? []).slice(0, COLLAPSED_COUNT);
  const hasMore = (donors?.length ?? 0) > COLLAPSED_COUNT;

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.entityUserDisplay}>
      <div className={styles.entityDetailsHeader}>
        <Typography variant="sectionTitle" textToDisplay="Supporters" />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      {hasDonors &&
        visibleDonors.map((user) => (
          <div key={user.id} className={styles.entityUserRow}>
            <UserAvatars
              fullName={user?.fullName}
              profilePicture={user.profilePicture}
              onClick={() => handleClick(user.id)}
            />
            <button
              type="button"
              className={styles.entityUserRowAddButton}
              onClick={() => handleClick(user.id)}
              aria-label={`View ${user?.fullName ?? "supporter"}'s profile`}
            >
              <AddIcon />
            </button>
          </div>
        ))}
      {hasDonors && hasMore && (
        <button
          type="button"
          className={styles.entityUserShowAll}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Show less" : "Show all"}
        </button>
      )}
    </div>
  );
};
