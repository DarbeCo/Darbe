import { useEffect, useState } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import { AddCircle, Remove } from "@mui/icons-material";

import {
  useDemoteUserFromAdminMutation,
  useGetRostersQuery,
  usePromoteUserToAdminMutation,
} from "../../services/api/endpoints/roster/roster.api";
import { RosterHeader } from "./RosterHeader";
import { RosterMember } from "./types";
import { RosterMemberCard } from "./RosterMemberCard";
import { Typography } from "../../components/typography/Typography";
import { DarbeButton } from "../../components/buttons/DarbeButton";
import { useAppDispatch } from "../../services/hooks";
import {
  setExternalData,
  setModalType,
  showModal,
} from "../../components/modal/modalSlice";
import { EDIT_SECTIONS } from "../users/userProfiles/constants";

import styles from "./styles/roster.module.css";

export const Roster = () => {
  const { data, isLoading } = useGetRostersQuery();
  const [promoteToAdmin] = usePromoteUserToAdminMutation();
  const [removeFromAdmin] = useDemoteUserFromAdminMutation();
  const [selectedRosterName, setSelectedRosterName] = useState<
    string | undefined
  >(data?.[0]?.rosterName);
  const [rosterMembers, setRosterMembers] = useState<
    RosterMember[] | undefined
  >(undefined);
  const [rosterId, setRosterId] = useState<string | undefined>(undefined);
  const availableRosterNames = data?.map((roster) => roster.rosterName);
  const dispatch = useAppDispatch();

  // TODO: Probably not needed but quick ez fix to set initial roster
  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedRosterName(data[0].rosterName);
    }
  }, [data]);

  // set roster members when data or selectedRosterName changes
  useEffect(() => {
    if (data) {
      const currentRoster = data.find(
        (roster) => roster.rosterName === selectedRosterName
      );
      setRosterId(currentRoster?.id);
      setRosterMembers(currentRoster?.members);
    }
  }, [data, selectedRosterName]);

  const emptyRoster = !rosterMembers || rosterMembers.length === 0;

  const handleEditRoster = () => {
    dispatch(setModalType(EDIT_SECTIONS.editRoster));
    dispatch(setExternalData(rosterId));
    dispatch(showModal());
  };

  const handleCreateRoster = () => {
    dispatch(setModalType(EDIT_SECTIONS.createRoster));
    dispatch(showModal());
  };

  const handlePromoteToAdmin = (userId: string) => {
    if (!rosterId) return;

    promoteToAdmin({ userId, rosterId });
  };

  const handleDemoteFromAdmin = (userId: string) => {
    if (!rosterId) return;

    removeFromAdmin({ userId, rosterId });
  };

  return (
    <>
      <div className={styles.rostersContainer}>
        {isLoading && <CircularProgress />}
        {!isLoading && (
          <RosterHeader
            rosterNames={availableRosterNames}
            selectedRoster={selectedRosterName}
            onRosterChange={setSelectedRosterName}
            onNewRoster={handleCreateRoster}
          />
        )}
        <div className={styles.rosterMembersHeader}>
          <Typography
            truncationLength={20}
            variant="sectionTitle"
            textToDisplay={selectedRosterName}
          />
          <DarbeButton
            darbeButtonType="secondaryNextButton"
            buttonText="Edit Roster"
            onClick={handleEditRoster}
          />
        </div>
        {emptyRoster && (
          <Typography
            variant="text"
            textToDisplay="No members in this roster"
          />
        )}
        {rosterMembers && (
          <div className={styles.rosterMembers}>
            {rosterMembers.map((member) => (
              <div className={styles.rosterMemberRow} key={member.user.id}>
                <RosterMemberCard key={member.user.id} rosterMember={member} />
                {!member.isAdmin && (
                  <IconButton
                    sx={{ backgroundColor: "white" }}
                    onClick={() => handlePromoteToAdmin(member.user.id)}
                  >
                    <AddCircle sx={{ color: "#2c77e7" }} />
                  </IconButton>
                )}
                {member.isAdmin && (
                  <IconButton
                    sx={{ backgroundColor: "white" }}
                    onClick={() => handleDemoteFromAdmin(member.user.id)}
                  >
                    <Remove sx={{ color: "#FF0000" }} />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
