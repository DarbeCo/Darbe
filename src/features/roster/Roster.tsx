import { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import { Search } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  useDeleteRosterMutation,
  useDemoteUserFromAdminMutation,
  useGetRostersQuery,
  usePromoteUserToAdminMutation,
  useRemoveMemberFromRosterMutation,
} from "../../services/api/endpoints/roster/roster.api";
import {
  useAcceptOrgJoinRequestMutation,
  useDenyOrgJoinRequestMutation,
  useGetOrgJoinRequestsQuery,
} from "../../services/api/endpoints/friends/friends.api";
import {
  RosterAdminPermissions,
  RosterMember,
} from "../../services/api/endpoints/types/roster.api.types";
import { OrgJoinRequestState } from "../friends/types";
import { useAppDispatch } from "../../services/hooks";
import {
  setExternalData,
  setModalType,
  showModal,
} from "../../components/modal/modalSlice";
import { EDIT_SECTIONS } from "../users/userProfiles/constants";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { assetUrl } from "../../utils/assetUrl";
import { SimpleCreateRoster } from "../../components/roster/SimpleCreateNewRoster";

import styles from "./styles/roster.module.css";

const formatMemberSince = (date?: string) => {
  if (!date) return "Member";

  return `Member since ${new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
};

const formatHours = (hours?: number) =>
  Number(hours ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });

const formatCurrency = (value?: number) =>
  `$${Math.round(value ?? 0).toLocaleString("en-US")}`;

const getRosterDisplayName = (rosterName?: string) =>
  !rosterName || rosterName.includes("Default Roster")
    ? "Member Roster"
    : rosterName;

const emptyPermissions: RosterAdminPermissions = {
  canEditAssignedRoster: false,
  canAssignVolunteerCoordinators: false,
  canEditInternalEvents: false,
  canEditExternalEvents: false,
};

type PermissionKey = keyof RosterAdminPermissions;

export const Roster = () => {
  const { data, isLoading } = useGetRostersQuery();
  const [deleteRoster, { isLoading: isDeletingRoster }] =
    useDeleteRosterMutation();
  const [promoteToAdmin, { isLoading: isPromoting }] =
    usePromoteUserToAdminMutation();
  const [removeFromAdmin, { isLoading: isDemoting }] =
    useDemoteUserFromAdminMutation();
  const [removeMemberFromRoster, { isLoading: isRemovingMember }] =
    useRemoveMemberFromRosterMutation();
  const { data: pendingJoinRequests = [], isLoading: isLoadingPendingRequests } =
    useGetOrgJoinRequestsQuery();
  const [acceptOrgJoinRequest, { isLoading: isAcceptingJoinRequest }] =
    useAcceptOrgJoinRequestMutation();
  const [denyOrgJoinRequest, { isLoading: isDenyingJoinRequest }] =
    useDenyOrgJoinRequestMutation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [inviteText, setInviteText] = useState("");
  const [adminDialogMember, setAdminDialogMember] =
    useState<RosterMember | null>(null);
  const [adminPermissions, setAdminPermissions] =
    useState<RosterAdminPermissions>(emptyPermissions);
  const [removeAsAdmin, setRemoveAsAdmin] = useState(false);
  const [showRemoveAdminConfirm, setShowRemoveAdminConfirm] = useState(false);
  const [showDeleteRosterConfirm, setShowDeleteRosterConfirm] = useState(false);
  const [adminStatusMessage, setAdminStatusMessage] = useState("");
  const [pendingRequestRows, setPendingRequestRows] = useState<
    OrgJoinRequestState[]
  >([]);
  const [handledJoinRequestIds, setHandledJoinRequestIds] = useState<string[]>(
    []
  );
  const [joinRequestStatusMessage, setJoinRequestStatusMessage] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedRosterId = searchParams.get("rosterId");
  const isCreateRosterView = searchParams.get("view") === "createRoster";
  const isPendingRequestsView = searchParams.get("view") === "pendingRequests";

  useEffect(() => {
    if (!data?.length) return;

    const selectedRosterExists = data.some(
      (roster) => roster.id === selectedRosterId
    );

    if (!selectedRosterId || !selectedRosterExists) {
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set("rosterId", data[0].id);
        return nextParams;
      }, { replace: true });
    }
  }, [data, selectedRosterId, setSearchParams]);

  useEffect(() => {
    setPendingRequestRows(
      pendingJoinRequests.filter(
        (request) => !handledJoinRequestIds.includes(request.id)
      )
    );
  }, [handledJoinRequestIds, pendingJoinRequests]);

  const currentRoster = useMemo(
    () => data?.find((roster) => roster.id === selectedRosterId) ?? data?.[0],
    [data, selectedRosterId]
  );
  const currentRosterName = getRosterDisplayName(currentRoster?.rosterName);
  const rosterId = currentRoster?.id;
  const rosterMembers = currentRoster?.members ?? [];
  const hasMultipleRosters = (data?.length ?? 0) > 1;
  const canDeleteRoster = Boolean(currentRoster?.id && hasMultipleRosters);
  const filteredMembers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return rosterMembers;

    return rosterMembers.filter((member) => {
      const memberName =
        member.user.fullName ||
        member.user.organizationName ||
        member.user.nonprofitName ||
        "";
      const causes = member.causes?.map((cause) => cause.name).join(" ") ?? "";

      return `${memberName} ${member.user.jobTitle ?? ""} ${causes}`
        .toLowerCase()
        .includes(query);
    });
  }, [rosterMembers, searchText]);
  const emptyRoster = !filteredMembers.length;
  const isAdminMutationLoading = isPromoting || isDemoting;
  const isRosterActionLoading = isAdminMutationLoading || isRemovingMember;
  const isJoinRequestActionLoading =
    isAcceptingJoinRequest || isDenyingJoinRequest;

  const handleEditRoster = () => {
    if (!rosterId) return;

    dispatch(setModalType(EDIT_SECTIONS.editRoster));
    dispatch(setExternalData(rosterId));
    dispatch(showModal());
  };

  const handleDeleteRoster = async () => {
    if (!currentRoster?.id || !data?.length) return;

    const nextRoster = data.find((roster) => roster.id !== currentRoster.id);

    await deleteRoster(currentRoster.id).unwrap();
    setShowDeleteRosterConfirm(false);

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (nextRoster?.id) {
        nextParams.set("rosterId", nextRoster.id);
      } else {
        nextParams.delete("rosterId");
      }
      nextParams.delete("view");
      return nextParams;
    });
  };

  const openAdminDialog = (member: RosterMember) => {
    setAdminDialogMember(member);
    setAdminPermissions(member.adminPermissions ?? emptyPermissions);
    setRemoveAsAdmin(false);
  };

  const closeAdminDialog = () => {
    setAdminDialogMember(null);
    setAdminPermissions(emptyPermissions);
    setRemoveAsAdmin(false);
    setShowRemoveAdminConfirm(false);
  };

  const handlePermissionChange = (permission: PermissionKey) => {
    setAdminPermissions((currentPermissions) => ({
      ...currentPermissions,
      [permission]: !currentPermissions[permission],
    }));
  };

  const handleSaveAdminDialog = async () => {
    if (!rosterId || !adminDialogMember) return;

    if (removeAsAdmin && !showRemoveAdminConfirm) {
      setShowRemoveAdminConfirm(true);
      return;
    }

    if (removeAsAdmin) {
      await removeFromAdmin({
        userId: adminDialogMember.user.id,
        rosterId,
      }).unwrap();
    } else {
      await promoteToAdmin({
        userId: adminDialogMember.user.id,
        rosterId,
        permissions: adminPermissions,
      }).unwrap();
    }

    const wasAdmin = adminDialogMember.isAdmin;

    closeAdminDialog();
    setAdminStatusMessage(
      removeAsAdmin
        ? "Admin Removed"
        : wasAdmin
          ? "Admin Updated"
          : "Admin Created"
    );
    setTimeout(() => setAdminStatusMessage(""), 1400);
  };

  const handleMemberClick = (member: RosterMember) => {
    navigate(`${PROFILE_ROUTE}/${member.user.id}`);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!rosterId) return;

    await removeMemberFromRoster({ memberId, rosterId }).unwrap();
  };

  const handleInvite = () => {
    setInviteText("");
  };

  const exitCreateRosterView = () => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("view");
      return nextParams;
    });
  };

  const exitRosterSubView = () => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("view");
      return nextParams;
    });
  };

  const handleAcceptJoinRequest = async (requestId: string) => {
    setHandledJoinRequestIds((currentIds) =>
      currentIds.includes(requestId) ? currentIds : [...currentIds, requestId]
    );
    setPendingRequestRows((currentRequests) =>
      currentRequests.filter((request) => request.id !== requestId)
    );

    try {
      await acceptOrgJoinRequest(requestId).unwrap();
      setJoinRequestStatusMessage("Request Accepted");
    } catch (error) {
      setHandledJoinRequestIds((currentIds) =>
        currentIds.filter((id) => id !== requestId)
      );
      setPendingRequestRows(pendingJoinRequests);
      throw error;
    }
  };

  const handleDenyJoinRequest = async (requestId: string) => {
    setHandledJoinRequestIds((currentIds) =>
      currentIds.includes(requestId) ? currentIds : [...currentIds, requestId]
    );
    setPendingRequestRows((currentRequests) =>
      currentRequests.filter((request) => request.id !== requestId)
    );

    try {
      await denyOrgJoinRequest(requestId).unwrap();
      setJoinRequestStatusMessage("Request Rejected");
    } catch (error) {
      setHandledJoinRequestIds((currentIds) =>
        currentIds.filter((id) => id !== requestId)
      );
      setPendingRequestRows(pendingJoinRequests);
      throw error;
    }
  };

  return (
    <div className={styles.rostersContainer}>
      <div className={styles.rosterMainColumn}>
        <label className={styles.rosterSearch}>
          <Search />
          <input
            type="search"
            placeholder="Search Roster Member"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>

        {!isCreateRosterView && !isPendingRequestsView && (
          <div className={styles.rosterInviteBar}>
            <input
              type="text"
              placeholder="Email Invite: johndoe@gmail.com, janedoe@yahoo.com"
              value={inviteText}
              onChange={(event) => setInviteText(event.target.value)}
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={!inviteText.trim()}
            >
              Invite
            </button>
          </div>
        )}

        {isCreateRosterView ? (
          <SimpleCreateRoster
            embedded
            memberSearchQuery={searchText}
            onCancel={exitCreateRosterView}
            onComplete={(createdRosterId) => {
              setSearchParams((currentParams) => {
                const nextParams = new URLSearchParams(currentParams);
                nextParams.delete("view");
                if (createdRosterId) {
                  nextParams.set("rosterId", createdRosterId);
                }
                return nextParams;
              });
            }}
          />
        ) : isPendingRequestsView ? (
          <section className={styles.rosterPanel}>
            <div className={styles.rosterMembersHeader}>
              <h1>Pending Requests</h1>
              <button type="button" onClick={exitRosterSubView}>
                Member Roster
              </button>
            </div>

            {isLoadingPendingRequests && (
              <div className={styles.rosterLoading}>
                <CircularProgress />
              </div>
            )}

            {!isLoadingPendingRequests && !pendingRequestRows.length && (
              <p className={styles.rosterEmpty}>No pending requests</p>
            )}

            {!isLoadingPendingRequests && pendingRequestRows.length > 0 && (
              <div className={styles.rosterPendingRequests}>
                {pendingRequestRows.map((request) => {
                  const requesterName =
                    request.requester.fullName ||
                    request.requester.organizationName ||
                    request.requester.nonprofitName ||
                    "Member";

                  return (
                    <article
                      className={styles.rosterPendingRequestCard}
                      key={request.id}
                    >
                      <button
                        type="button"
                        className={styles.rosterMemberIdentity}
                        onClick={() => navigate(`${PROFILE_ROUTE}/${request.requester.id}`)}
                      >
                        <img
                          src={
                            request.requester.profilePicture ||
                            assetUrl("/images/defaultProfilePicture.jpg")
                          }
                          alt=""
                        />
                        <span>
                          <strong>{requesterName}</strong>
                          <em>Requested to join</em>
                        </span>
                      </button>
                      <div className={styles.rosterMemberActions}>
                        <button
                          type="button"
                          className={styles.rosterPrimaryAction}
                          onClick={() => handleAcceptJoinRequest(request.id)}
                          disabled={isJoinRequestActionLoading}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className={styles.rosterRemoveAction}
                          onClick={() => handleDenyJoinRequest(request.id)}
                          disabled={isJoinRequestActionLoading}
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className={styles.rosterPanel}>
            <div className={styles.rosterMembersHeader}>
              <h1>
                {currentRosterName}
                <span>
                  {rosterMembers.length}{" "}
                  {rosterMembers.length === 1 ? "member" : "members"}
                </span>
              </h1>
              <div className={styles.rosterHeaderActions}>
                <button type="button" onClick={handleEditRoster}>
                  Edit Roster
                </button>
                <button
                  type="button"
                  className={styles.rosterRemoveAction}
                  onClick={() => setShowDeleteRosterConfirm(true)}
                  disabled={!canDeleteRoster || isDeletingRoster}
                >
                  Delete Roster
                </button>
              </div>
            </div>

            {isLoading && (
              <div className={styles.rosterLoading}>
                <CircularProgress />
              </div>
            )}

            {!isLoading && emptyRoster && (
              <p className={styles.rosterEmpty}>No members in this roster</p>
            )}

            {!isLoading && !emptyRoster && (
              <div className={styles.rosterMembers}>
                {filteredMembers.map((member) => {
                  const memberName =
                    member.user.fullName ||
                    member.user.organizationName ||
                    member.user.nonprofitName ||
                    "Roster Member";
                  const visibleCauses = member.causes?.slice(0, 3) ?? [];
                  const extraCauses = Math.max(
                    (member.causes?.length ?? 0) - 3,
                    0
                  );
                  const summary = member.volunteerSummary;

                  return (
                    <article
                      className={styles.rosterMemberCard}
                      key={member.user.id}
                    >
                      <div className={styles.rosterMemberTopRow}>
                        <button
                          type="button"
                          className={styles.rosterMemberIdentity}
                          onClick={() => handleMemberClick(member)}
                        >
                          <img
                            src={
                              member.user.profilePicture ||
                              assetUrl("/images/defaultProfilePicture.jpg")
                            }
                            alt=""
                          />
                          <span>
                            <strong>{memberName}</strong>
                            <em>{member.user.jobTitle || "Volunteer"}</em>
                          </span>
                        </button>

                        <div className={styles.rosterMemberActions}>
                          {member.isAdmin && (
                            <span className={styles.rosterAdminLabel}>
                              Admin
                            </span>
                          )}
                          <button
                            type="button"
                            className={
                              member.isAdmin
                                ? styles.rosterSecondaryAction
                                : styles.rosterPrimaryAction
                            }
                            onClick={() => openAdminDialog(member)}
                            disabled={isRosterActionLoading}
                          >
                            {member.isAdmin ? "Edit Admin" : "Make Admin"}
                          </button>
                          <button
                            type="button"
                            className={styles.rosterRemoveAction}
                            onClick={() => handleRemoveMember(member.user.id)}
                            disabled={isRosterActionLoading}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <p className={styles.rosterMemberSince}>
                        {formatMemberSince(member.memberSince)}:{" "}
                        <strong>
                          {formatHours(summary?.hoursVolunteered)} vol hours
                        </strong>
                      </p>

                      <div className={styles.rosterMemberGrid}>
                        <section className={styles.rosterInfoCard}>
                          <h2>Total Volunteer Summary</h2>
                          <dl>
                            <div>
                              <dt>{formatHours(summary?.hoursVolunteered)}</dt>
                              <dd>Hours Volunteered</dd>
                            </div>
                            <div>
                              <dt>{formatCurrency(summary?.volunteerValue)}</dt>
                              <dd>Volunteer Value</dd>
                            </div>
                            <div>
                              <dt>{summary?.eventsAttended ?? 0}</dt>
                              <dd>Events Attended</dd>
                            </div>
                          </dl>
                        </section>

                        <section className={styles.rosterInfoCard}>
                          <h2>Interested Causes</h2>
                          {visibleCauses.length ? (
                            <ul className={styles.rosterCauseList}>
                              {visibleCauses.map((cause) => (
                                <li key={cause.id}>
                                  <img
                                    src={
                                      cause.imageUrl ||
                                      assetUrl("/images/defaultCoverPhoto.jpg")
                                    }
                                    alt=""
                                  />
                                  <span>{cause.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.rosterNoCauses}>
                              No causes added
                            </p>
                          )}
                          {extraCauses > 0 && (
                            <span className={styles.rosterExtraCauses}>
                              +{extraCauses} more
                            </span>
                          )}
                        </section>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {adminDialogMember && (
        <div className={styles.rosterAdminDialogOverlay}>
          <div
            className={styles.rosterAdminDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="roster-admin-dialog-title"
          >
            <h2 id="roster-admin-dialog-title">
              {adminDialogMember.isAdmin ? "Edit Admin" : "Make Admin"}
            </h2>
            <p>Please choose admin responsibilities.</p>

            <div className={styles.rosterAdminPermissions}>
              <label>
                <input
                  type="checkbox"
                  checked={adminPermissions.canEditAssignedRoster}
                  onChange={() => handlePermissionChange("canEditAssignedRoster")}
                  disabled={removeAsAdmin}
                />
                <span>Create/Edit Assigned roster</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={adminPermissions.canAssignVolunteerCoordinators}
                  onChange={() =>
                    handlePermissionChange("canAssignVolunteerCoordinators")
                  }
                  disabled={removeAsAdmin}
                />
                <span>Assign Volunteer Coordinators</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={adminPermissions.canEditInternalEvents}
                  onChange={() => handlePermissionChange("canEditInternalEvents")}
                  disabled={removeAsAdmin}
                />
                <span>Create/Edit Internal events</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={adminPermissions.canEditExternalEvents}
                  onChange={() => handlePermissionChange("canEditExternalEvents")}
                  disabled={removeAsAdmin}
                />
                <span>Create/Edit external events</span>
              </label>
              <label
                className={
                  !adminDialogMember.isAdmin
                    ? styles.rosterAdminDisabledPermission
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  checked={removeAsAdmin}
                  onChange={() => setRemoveAsAdmin((current) => !current)}
                  disabled={!adminDialogMember.isAdmin}
                />
                <span>Remove as admin</span>
              </label>
            </div>

            <div className={styles.rosterAdminDialogActions}>
              <button
                type="button"
                className={styles.rosterAdminCancel}
                onClick={closeAdminDialog}
                disabled={isAdminMutationLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.rosterAdminSave}
                onClick={handleSaveAdminDialog}
                disabled={isAdminMutationLoading}
              >
                {removeAsAdmin
                  ? "Remove Admin"
                  : adminDialogMember.isAdmin
                    ? "Update"
                    : "Make Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveAdminConfirm && adminDialogMember && (
        <div className={styles.rosterRemoveAdminConfirmOverlay}>
          <div
            className={styles.rosterRemoveAdminConfirm}
            role="dialog"
            aria-modal="true"
          >
            <p>Are you sure you want to remove this person an admin?</p>
            <div className={styles.rosterRemoveAdminConfirmActions}>
              <button
                type="button"
                onClick={handleSaveAdminDialog}
                disabled={isAdminMutationLoading}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowRemoveAdminConfirm(false)}
                disabled={isAdminMutationLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteRosterConfirm && currentRoster && (
        <div className={styles.rosterRailConfirmOverlay}>
          <div
            className={styles.rosterRailConfirm}
            role="dialog"
            aria-modal="true"
          >
            <p>
              Are you sure you want to remove {currentRosterName}?
            </p>
            <div className={styles.rosterRailConfirmActions}>
              <button
                type="button"
                onClick={handleDeleteRoster}
                disabled={isDeletingRoster}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteRosterConfirm(false)}
                disabled={isDeletingRoster}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {adminStatusMessage && (
        <div className={styles.rosterAdminToast} role="status">
          {adminStatusMessage}
        </div>
      )}

      {joinRequestStatusMessage && (
        <div className={styles.rosterStatusDialogOverlay}>
          <div
            className={styles.rosterStatusDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="roster-status-dialog-title"
          >
            <h2 id="roster-status-dialog-title">{joinRequestStatusMessage}</h2>
            <button
              type="button"
              onClick={() => setJoinRequestStatusMessage("")}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
