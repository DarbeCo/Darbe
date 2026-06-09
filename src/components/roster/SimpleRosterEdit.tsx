import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AddCircle, Remove } from "@mui/icons-material";
import { useState } from "react";

import { selectCurrentUserId } from "../../features/users/selectors";
import {
  useAddFollowerToRosterMutation,
  useGetRosterAddCandidatesQuery,
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
  externalData:
    | string
    | {
        rosterId: string;
        rosterOwnerId?: string;
      }
    | undefined;
}

export const SimpleRosterEdit = ({ externalData }: SimpleRosterEditProps) => {
  const rosterId =
    typeof externalData === "string" ? externalData : externalData?.rosterId ?? "";
  const rosterOwnerId =
    typeof externalData === "string" ? undefined : externalData?.rosterOwnerId;
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const ownerId = rosterOwnerId ?? userId;
  const [candidateSearchText, setCandidateSearchText] = useState("");
  const { data, isLoading } = useGetRosterMembersQuery(rosterId, {
    skip: !rosterId,
  });
  const { data: addCandidates, isLoading: isLoadingAddCandidates } =
    useGetRosterAddCandidatesQuery(
      { rosterId, ownerId, searchText: candidateSearchText },
      { skip: !rosterId }
    );
  const [addToRoster, { isLoading: isAddingToRoster }] =
    useAddFollowerToRosterMutation();
  const [removeFromRoster, { isLoading: isRemovingFromRoster }] =
    useRemoveMemberFromRosterMutation();
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
      {!rosterId && (
        <p className={styles.editRosterEmpty}>No roster selected.</p>
      )}

      {(isLoading || isLoadingAddCandidates) && (
        <div className={styles.editRosterLoading}>
          <CircularProgress />
        </div>
      )}

      {rosterId && !isLoading && !isLoadingAddCandidates && (
        <>
          <section className={styles.editRosterSection}>
            <div className={styles.editRosterSectionHeader}>
              <Typography variant="sectionTitle" textToDisplay="Darbe People" />
              <span>{addCandidates?.length ?? 0} available</span>
            </div>

            <label className={styles.editRosterSearch}>
              <span>Search Darbe people</span>
              <input
                type="search"
                value={candidateSearchText}
                onChange={(event) => setCandidateSearchText(event.target.value)}
                placeholder="Search by name"
              />
            </label>

            <div className={styles.editRosterList}>
              {!addCandidates?.length && (
                <p className={styles.editRosterEmpty}>No people to add</p>
              )}
              {addCandidates?.map((candidate) => (
                <div className={styles.editRosterRow} key={candidate.id}>
                  <UserAvatars
                    userId={candidate.id}
                    fullName={candidate.fullName}
                    profilePicture={candidate.profilePicture}
                    onClick={() => handleAvatarClick(candidate.id)}
                    className={styles.editRosterAvatar}
                    infoClassName={styles.editRosterAvatarInfo}
                  />
                  <button
                    type="button"
                    className={styles.editRosterIconButton}
                    onClick={() => handleAddFollowerToRoster(candidate.id)}
                    disabled={isBusy}
                    aria-label="Add person to roster"
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
