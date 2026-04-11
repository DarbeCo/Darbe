import { useState } from "react";
import { IconButton } from "@mui/material";
import { Remove } from "@mui/icons-material";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { Typography } from "../../../../components/typography/Typography";
import { isValidArray } from "../../../../utils/CommonFunctions";
import { SimpleUserState } from "../../userProfiles/types";
import { EditEntityProfileProps } from "../editSections/types";
import { EditEntityStaff } from "./EditEntityStaff";
import { useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId } from "../../selectors";
import {
  useGetDonorsAndStaffQuery,
  useRemoveFromDonorsMutation,
  useRemoveFromStaffMutation,
} from "../../../../services/api/endpoints/profiles/profiles.api";
import { UserAvatars } from "../../../../components/avatars/UserAvatars";

import styles from "../styles/profileEdit.module.css";
interface EditEntityUsersProps extends EditEntityProfileProps {
  editType: "donors" | "staff";
  donors?: SimpleUserState[];
  staff?: SimpleUserState[];
}

export const EditEntityUsers = ({
  editType,
  donors,
  staff,
}: EditEntityUsersProps) => {
  const userId = useAppSelector(selectCurrentUserId);
  const { data: donorsAndStaff } = useGetDonorsAndStaffQuery({ userId });
  const [removeDonor] = useRemoveFromDonorsMutation();
  const [removeStaff] = useRemoveFromStaffMutation();
  const textToDisplay = editType === "donors" ? "Donors" : "Staff";
  const dataToRender =
    editType === "donors" ? donorsAndStaff?.donors : donorsAndStaff?.staff;
  const mutationToUse = editType === "donors" ? removeDonor : removeStaff;
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const hasDonors = isValidArray(donors) && editType === "donors";
  const hasStaff = isValidArray(staff) && editType === "staff";
  const noMembersToDisplay = !hasDonors || !hasStaff;

  const handleClick = () => {
    setIsAddingStaff(!isAddingStaff);
  };

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.profileEntityHeader}>
        <div className={styles.editEntityUserHeader}>
          <Typography
            variant="header"
            textToDisplay={`Major ${textToDisplay}`}
          />
          <DarbeButton
            darbeButtonType={isAddingStaff ? "postButton" : "nextButton"}
            onClick={handleClick}
            buttonText={isAddingStaff ? `Finish` : `Add ${textToDisplay}`}
          />
        </div>
        {noMembersToDisplay && !isAddingStaff && (
          <Typography
            variant="informational"
            extraClass="noMembersInStaff"
            textToDisplay={`No ${textToDisplay} to display`}
          />
        )}
        {!isAddingStaff &&
          dataToRender?.map((user) => (
            <div className={styles.rosterRow}>
              <UserAvatars
                profilePicture={user?.profilePicture}
                fullName={user?.fullName}
              />
              <IconButton
                sx={{ backgroundColor: "white" }}
                onClick={() => mutationToUse({ userId: user?.id })}
              >
                <Remove sx={{ color: "#FF0000" }} />
              </IconButton>
            </div>
          ))}
        {isAddingStaff && <EditEntityStaff category={editType} />}
      </div>
    </div>
  );
};
