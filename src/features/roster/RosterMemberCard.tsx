import { useNavigate } from "react-router-dom";

import { RosterMember } from "./types";
import { UserAvatars } from "../../components/avatars/UserAvatars";

import styles from "./styles/roster.module.css";
import { PROFILE_ROUTE } from "../../routes/route.constants";

// TODO: Probably can combine this and the VolunteerCard with some variations
export const RosterMemberCard = ({
  rosterMember,
}: {
  rosterMember: RosterMember;
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`${PROFILE_ROUTE}/${rosterMember.user.id}`);
  };

  // TODO: Fill out after adding a roster user
  return (
    <div className={styles.rosterMemberCard}>
      <UserAvatars
        profilePicture={rosterMember.user.profilePicture}
        fullName={rosterMember.user.fullName}
        onClick={handleClick}
      />
      {rosterMember.isAdmin && <span className={styles.adminBadge}>Admin</span>}
    </div>
  );
};
