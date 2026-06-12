import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AddCircle, CheckCircle } from "@mui/icons-material";
import { CircularProgress, IconButton } from "@mui/material";

import { NewRoster } from "../../services/api/endpoints/types/roster.api.types";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../../features/users/selectors";
import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";
import {
  useCreateRosterMutation,
  useGetRosterAddCandidatesQuery,
  useGetRostersQuery,
} from "../../services/api/endpoints/roster/roster.api";
import { ConfirmDialog } from "../confirmDialog/ConfirmDialog";
import { hideModal } from "../modal/modalSlice";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./rosterComponents.module.css";

const getDisplayName = (member: SimpleUserInfo) =>
  member.fullName || member.nonprofitName || member.organizationName || "Member";

const getRosterDisplayName = (rosterName?: string) =>
  !rosterName || rosterName.includes("Default Roster")
    ? "Member Roster"
    : rosterName;

const normalizeRosterName = (rosterName: string) =>
  rosterName.trim().toLowerCase();

interface SimpleCreateRosterProps {
  embedded?: boolean;
  memberSearchQuery?: string;
  rosterOwnerId?: string;
  onCancel?: () => void;
  onComplete?: (createdRosterId?: string) => void;
}

export const SimpleCreateRoster = ({
  embedded = false,
  memberSearchQuery = "",
  rosterOwnerId,
  onCancel,
  onComplete,
}: SimpleCreateRosterProps) => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUserId);
  const ownerId = rosterOwnerId ?? userId;
  const [newRosterData, setNewRosterData] = useState<NewRoster>({
    rosterName: "",
    rosterOwner: ownerId,
    members: [],
  });
  const { data: addCandidates, isLoading } = useGetRosterAddCandidatesQuery({
    ownerId,
    searchText: memberSearchQuery,
  });
  const { data: rosters = [] } = useGetRostersQuery(ownerId);
  const [createNewRoster, { isLoading: isCreatingRoster }] =
    useCreateRosterMutation();
  const [rosterNameError, setRosterNameError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<SimpleUserInfo | null>(
    null
  );
  const rosterName = newRosterData.rosterName.trim();
  const rosterNameAlreadyExists = useMemo(() => {
    if (!rosterName) return false;

    return rosters.some(
      (roster) =>
        normalizeRosterName(getRosterDisplayName(roster.rosterName)) ===
        normalizeRosterName(rosterName)
    );
  }, [rosterName, rosters]);
  const createRosterError = rosterNameAlreadyExists
    ? "Roster name already exists."
    : rosterNameError;
  const recentMembers = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();

    return [...(addCandidates ?? [])]
      .filter((member) => {
        if (!query) return true;

        return `${getDisplayName(member)} ${member.jobTitle ?? ""}`
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 5);
  }, [addCandidates, memberSearchQuery]);
  const selectedMemberIds = new Set(newRosterData.members);

  useEffect(() => {
    setNewRosterData((currentData) => ({
      ...currentData,
      rosterOwner: ownerId,
    }));
  }, [ownerId]);

  const handleRosterNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRosterNameError("");
    setNewRosterData((currentData) => ({
      ...currentData,
      rosterName: event.target.value,
    }));
  };

  const handleToggleMember = (member: SimpleUserInfo) => {
    const memberIsSelected = newRosterData.members.includes(member.id);

    if (memberIsSelected) {
      setMemberToRemove(member);
      return;
    }

    setNewRosterData((currentData) => {
      return {
        ...currentData,
        members: memberIsSelected
          ? currentData.members.filter((id) => id !== member.id)
          : [...currentData.members, member.id],
      };
    });
  };

  const handleConfirmRemoveMember = () => {
    if (!memberToRemove) return;

    setNewRosterData((currentData) => ({
      ...currentData,
      members: currentData.members.filter((id) => id !== memberToRemove.id),
    }));
    setMemberToRemove(null);
  };

  const handleSubmit = async () => {
    if (!rosterName || rosterNameAlreadyExists) return;

    try {
      const createdRoster = await createNewRoster({
        ...newRosterData,
        rosterName,
      }).unwrap();
      onComplete?.(createdRoster.id);
      if (!embedded) {
        dispatch(hideModal());
      }
    } catch (error) {
      console.error("Error creating new roster:", error);
      const message =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      setRosterNameError(message ?? "Unable to create roster.");
    }
  };

  return (
    <div
      className={`${styles.createRosterContent} ${
        embedded ? styles.createRosterEmbedded : ""
      }`}
    >
      {embedded && (
        <div className={styles.createRosterEmbeddedHeader}>
          <span aria-hidden="true" />
          <h1>Create Roster</h1>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close create roster"
          >
            x
          </button>
        </div>
      )}

      <label className={styles.createRosterField}>
        <span>
          Create Roster Name<strong>*</strong>
        </span>
        <input
          name="rosterName"
          type="text"
          placeholder="Create Roster Name"
          value={newRosterData.rosterName}
          onChange={handleRosterNameChange}
          aria-invalid={Boolean(createRosterError)}
          aria-describedby={createRosterError ? "create-roster-name-error" : undefined}
        />
        {createRosterError && (
          <p id="create-roster-name-error">{createRosterError}</p>
        )}
      </label>

      <section className={styles.createRosterRecentSection}>
        <h2>Member Roster</h2>
        <div className={styles.createRosterRecentList}>
          {isLoading && (
            <div className={styles.createRosterLoading}>
              <CircularProgress size={28} />
            </div>
          )}
          {!isLoading &&
            recentMembers.map((member) => {
              const memberIsSelected = selectedMemberIds.has(member.id);

              return (
                <article className={styles.createRosterMemberRow} key={member.id}>
                  <div className={styles.createRosterMemberIdentity}>
                    <img
                      src={
                        member.profilePicture ||
                        assetUrl("/images/defaultProfilePicture.jpg")
                      }
                      alt=""
                    />
                    <span>
                      <strong>{getDisplayName(member)}</strong>
                      <em>{member.jobTitle || "Volunteer"}</em>
                    </span>
                  </div>
                  <IconButton
                    aria-label={
                      memberIsSelected
                        ? `Remove ${getDisplayName(member)}`
                        : `Add ${getDisplayName(member)}`
                    }
                    onClick={() => handleToggleMember(member)}
                    className={styles.createRosterMemberAction}
                  >
                    {memberIsSelected ? <CheckCircle /> : <AddCircle />}
                  </IconButton>
                </article>
              );
            })}
          {!isLoading && recentMembers.length === 0 && (
            <p className={styles.createRosterEmpty}>No members available.</p>
          )}
        </div>
      </section>

      <div className={styles.createRosterFooter}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!rosterName || rosterNameAlreadyExists || isCreatingRoster}
        >
          Create Roster
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
      {memberToRemove && (
        <ConfirmDialog
          title={`Remove ${getDisplayName(memberToRemove)}?`}
          message="This will remove them from this roster draft."
          confirmLabel="Remove"
          onConfirm={handleConfirmRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
};
