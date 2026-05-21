import { CircularProgress } from "@mui/material";
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
  const [addToRoster, { isLoading: isAddingToRoster }] =
    useAddFollowerToRosterMutation();
  const [removeFromRoster, { isLoading: isRemovingFromRoster }] =
    useRemoveMemberFromRosterMutation();
  const followersNotInRoster = followers?.filter(
    (follower) => !data?.some((member) => member.user.id === follower.id)
  );
  const isBusy = isAddingToRoster || isRemovingFromRoster;

  const handleAvatarClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  const handleAddFollowerToRoster = async (followerId: string) => {
    await addToRoster({ followerId, rosterId }).unwrap();
  };

  const handleRemoveMemberFromRoster = async (memberId: string) => {
    await removeFromRoster({ memberId, rosterId }).unwrap();
  };

  return (
    <div className={styles.editRosterContent}>
      {(isLoading || isLoadingFollowers) && (
        <div className={styles.editRosterLoading}>
          <CircularProgress />
        </div>
      )}

      {!isLoading && !isLoadingFollowers && (
        <>
          <section className={styles.editRosterSection}>
            <div className={styles.editRosterSectionHeader}>
              <Typography variant="sectionTitle" textToDisplay="Your Followers" />
              <span>{followersNotInRoster?.length ?? 0} available</span>
            </div>

            <div className={styles.editRosterList}>
              {!followersNotInRoster?.length && (
                <p className={styles.editRosterEmpty}>No followers to add</p>
              )}
              {followersNotInRoster?.map((follower) => (
                <div className={styles.editRosterRow} key={follower.id}>
                  <UserAvatars
                    userId={follower.id}
                    fullName={
                      follower.fullName ||
                      follower.nonprofitName ||
                      follower.organizationName
                    }
                    profilePicture={follower.profilePicture}
                    onClick={() => handleAvatarClick(follower.id)}
                    className={styles.editRosterAvatar}
                    infoClassName={styles.editRosterAvatarInfo}
                  />
                  <button
                    type="button"
                    className={styles.editRosterIconButton}
                    onClick={() => handleAddFollowerToRoster(follower.id)}
                    disabled={isBusy}
                    aria-label="Add follower to roster"
                  >
                    <AddCircle />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.editRosterSection}>
            <div className={styles.editRosterSectionHeader}>
              <Typography
                variant="sectionTitle"
                textToDisplay="Current Roster Members"
              />
              <span>{data?.length ?? 0} members</span>
            </div>

            <div className={styles.editRosterList}>
              {!data?.length && (
                <p className={styles.editRosterEmpty}>No members in this roster</p>
              )}
              {data?.map((member) => (
                <div className={styles.editRosterRow} key={member.user.id}>
                  <UserAvatars
                    userId={member.user.id}
                    fullName={
                      member.user.fullName ||
                      member.user.nonprofitName ||
                      member.user.organizationName
                    }
                    profilePicture={member.user.profilePicture}
                    onClick={() => handleAvatarClick(member.user.id)}
                    className={styles.editRosterAvatar}
                    infoClassName={styles.editRosterAvatarInfo}
                  />
                  <button
                    type="button"
                    className={`${styles.editRosterIconButton} ${styles.editRosterRemoveButton}`}
                    onClick={() => handleRemoveMemberFromRoster(member.user.id)}
                    disabled={isBusy}
                    aria-label="Remove member from roster"
                  >
                    <Remove />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
