import { useState } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import { AddCircle, Remove } from "@mui/icons-material";

import { Typography } from "../typography/Typography";
import { NewRoster } from "../../services/api/endpoints/types/roster.api.types";
import { DarbeButton } from "../buttons/DarbeButton";
import { Inputs } from "../inputs/Inputs";
import { useGetEntityFollowersQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../../features/users/selectors";
import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";
import { UserAvatars } from "../avatars/UserAvatars";
import { useCreateRosterMutation } from "../../services/api/endpoints/roster/roster.api";
import { hideModal } from "../modal/modalSlice";

import styles from "./rosterComponents.module.css";

// TODO: Probably some css but keep the modal setup
export const SimpleCreateRoster = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUserId);
  const [newRosterData, setNewRosterData] = useState<NewRoster>({
    rosterName: "",
    rosterOwner: userId,
    members: [],
  });
  const { data: followers, isLoading } = useGetEntityFollowersQuery(userId);
  const [createNewRoster] = useCreateRosterMutation();
  const [availableFollowers, setAvailableFollowers] = useState<
    SimpleUserInfo[] | undefined
  >(followers);
  const [selectedRosterMembers, setSelectedRosterMembers] = useState<
    SimpleUserInfo[]
  >([]);
  const [modalStep, setModalStep] = useState(1);

  const handleNext = () => {
    setModalStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setModalStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      await createNewRoster(newRosterData);
      dispatch(hideModal());
    } catch (error) {
      console.error("Error creating new roster:", error);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRosterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddToNewRoster = (followerId: string) => {
    setNewRosterData((prev) => ({
      ...prev,
      members: [...prev.members, followerId],
    }));

    const rosterMemberDisplayInfo = followers?.filter(
      (follower) => follower.id === followerId
    );

    if (rosterMemberDisplayInfo?.length) {
      setSelectedRosterMembers((rosterMembers) => [
        ...rosterMembers,
        ...rosterMemberDisplayInfo,
      ]);

      setAvailableFollowers((prev) =>
        prev?.filter((follower) => follower.id !== followerId)
      );
    }
  };

  const handleMoveOutOfNewRoster = (followerId: string) => {
    setNewRosterData((prev) => ({
      ...prev,
      members: prev.members.filter((id) => id !== followerId),
    }));

    const rosterMemberDisplayInfo = selectedRosterMembers?.filter(
      (member) => member.id === followerId
    );

    if (rosterMemberDisplayInfo?.length) {
      setAvailableFollowers((prev) => [
        ...(prev || []),
        ...rosterMemberDisplayInfo,
      ]);
      setSelectedRosterMembers((members) =>
        members.filter((member) => member.id !== followerId)
      );
    }
  };

  const firstStepContent = (
    <div className={styles.stepOneContent}>
      <Inputs
        darbeInputType="standardInput"
        label="Roster Name"
        name="rosterName"
        handleChange={onChange}
      />
    </div>
  );

  const secondStepContent = (
    <div className={styles.stepTwoContent}>
      {isLoading && <CircularProgress />}
      <div className={styles.organizationFollowers}>
        <Typography variant="sectionTitle" textToDisplay={"Your Followers"} />
        {availableFollowers?.map((follower) => (
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
            />
            <IconButton
              sx={{ backgroundColor: "white" }}
              onClick={() => handleAddToNewRoster(follower.id)}
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
        {selectedRosterMembers.map((member: SimpleUserInfo) => (
          <div className={styles.rosterRow} key={member.id}>
            <UserAvatars
              userId={member.id}
              fullName={
                member.fullName ||
                member.nonprofitName ||
                member.organizationName
              }
              profilePicture={member.profilePicture}
            />
            <IconButton
              sx={{ backgroundColor: "white" }}
              onClick={() => handleMoveOutOfNewRoster(member.id)}
            >
              <Remove sx={{ color: "#FF0000" }} />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.createRosterContent}>
      {modalStep === 1 && firstStepContent}
      {modalStep === 2 && secondStepContent}
      <div className={styles.modalFooter}>
        {modalStep > 1 && (
          <DarbeButton
            buttonText="Back"
            darbeButtonType="postActionButton"
            onClick={handleBack}
          />
        )}
        {modalStep < 2 && (
          <DarbeButton
            buttonText="Next"
            darbeButtonType="secondaryNextButton"
            onClick={handleNext}
          />
        )}
        {modalStep === 2 && (
          <DarbeButton
            buttonText="Create"
            darbeButtonType="saveButton"
            onClick={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};
