import { CircularProgress, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AddCircle, Remove } from "@mui/icons-material";

import { selectCurrentUserId } from "../../features/users/selectors";
import { useGetEntityFollowersQuery } from "../../services/api/endpoints/profiles/profiles.api";
import {
  useAddFollowerToRosterMutation,
  useGetRosterMembersQuery,
  useRemoveMemberFromRosterMutation,
} from "../../services/api/endpoints/roster/roster.api";
import { useAppSelector } from "../../services/hooks";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { PROFILE_ROUTE } from "../../routes/route.constants";

import styles from "./rosterComponents.module.css";

// TODO: These should be a generic
interface SimpleRosterEditProps {
  externalData: any;
}

export const SimpleRosterEdit = ({ externalData }: SimpleRosterEditProps) => {
  const rosterId = externalData;
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const { data, isLoading } = useGetRosterMembersQuery(rosterId);
  const { data: followers, isLoading: isLoadingFollowers } =
    useGetEntityFollowersQuery(userId);
  const [addToRoster] = useAddFollowerToRosterMutation();
  const [removeFromRoster] = useRemoveMemberFromRosterMutation();
  const followersNotInRoster = followers?.filter(
    (follower) => !data?.some((member) => member.user.id === follower.id)
  );

  const handleAvatarClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  const handleAddFollowerToRoster = (followerId: string) => {
    addToRoster({ followerId, rosterId });
  };

  const handleRemoveMemberFromRoster = (memberId: string) => {
    removeFromRoster({ memberId, rosterId });
  };

  return (
    <div>
      {isLoading && isLoadingFollowers && <CircularProgress />}
      <div className={styles.organizationFollowers}>
        <Typography variant="sectionTitle" textToDisplay={"Your Followers"} />
        {followersNotInRoster?.map((follower) => (
          <div className={styles.rosterRow} key={follower.id}>
            <UserAvatars
              key={follower.id}
              userId={follower.id}
              fullName={
                follower.fullName ||
                follower.nonprofitName ||
                follower.organizationName
              }
              profilePicture={follower.profilePicture}
              onClick={() => handleAvatarClick(follower.id)}
            />
            <IconButton
              sx={{ backgroundColor: "white" }}
              onClick={() => handleAddFollowerToRoster(follower.id)}
            >
              <AddCircle sx={{ color: "#2c77e7" }} />
            </IconButton>
          </div>
        ))}
      </div>
      <div className={styles.rosterMembers}>
        <Typography
          variant="sectionTitle"
          textToDisplay={"Current Roster Members"}
        />
        {data?.map((member) => (
          <div className={styles.rosterRow} key={member.user.id}>
            <UserAvatars
              userId={member.user.id}
              fullName={
                member.user.fullName ||
                member.user.nonprofitName ||
                member.user.organizationName
              }
              profilePicture={member.user.profilePicture}
              onClick={() => handleAvatarClick(member.user.id)}
            />
            <IconButton
              sx={{ backgroundColor: "white" }}
              onClick={() => handleRemoveMemberFromRoster(member.user.id)}
            >
              <Remove sx={{ color: "#FF0000" }} />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
};
