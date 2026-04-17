import { useState } from "react";
import { Checkbox } from "@mui/material";

import { Causes } from "../../../../components/causes/Causes";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserCauses, selectCurrentUserId } from "../../selectors";
import { useGetCausesQuery } from "../../../../services/api/endpoints/causes/causes.api";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserCauses } from "../../userSlice";
import {
  hideModal,
  setModalType,
  showModal,
} from "../../../../components/modal/modalSlice";
import { EDIT_SECTIONS } from "../../userProfiles/constants";

import styles from "../styles/profileEdit.module.css";

export const EditCauses = () => {
  const dispatch = useAppDispatch();
  const currentCauses = useAppSelector(selectCurrentUserCauses);
  const userId = useAppSelector(selectCurrentUserId);
  const [updateUserProfile] = useUpdateEntityProfileMutation();
  const { data: causes = [] } = useGetCausesQuery();
  const [updatedCauses, setUpdatedCauses] = useState<string[]>(currentCauses);
  const allCauseIds = causes.map((cause) => cause.id);
  const areAllCausesSelected =
    allCauseIds.length > 0 &&
    allCauseIds.every((causeId) => updatedCauses.includes(causeId));

  const handleCauseChange = (evt: React.MouseEvent<HTMLButtonElement>) => {
    const target = evt.currentTarget as HTMLButtonElement;
    const causeId = target.dataset.causeId;
    const causeName = target.textContent?.trim();

    setUpdatedCauses((prevState) => {
      const hasId = causeId ? prevState.includes(causeId) : false;
      const hasName = causeName ? prevState.includes(causeName) : false;
      const isAlreadySelected = hasId || hasName;

      if (isAlreadySelected) {
        return prevState.filter(
          (selectedCause) =>
            selectedCause !== causeId && selectedCause !== causeName
        );
      }

      const valueToAdd = causeId || causeName;
      if (!valueToAdd) return prevState;

      const nextState = [...prevState, valueToAdd];
      return Array.from(new Set(nextState));
    });
  };

  const handleToggleSelectAll = () => {
    setUpdatedCauses(() => (areAllCausesSelected ? [] : allCauseIds));
  };

  const persistCauses = async (shouldClose: boolean) => {
    const payload = {
      user: { id: userId, causes: updatedCauses },
    };

    const updatedUser = await updateUserProfile(payload).unwrap();

    if (updatedUser.user?.causes) {
      dispatch(updateUserCauses(updatedUser.user.causes));
    }

    if (shouldClose) {
      dispatch(hideModal());
    }
  };

  const handleSaveCauses = async () => {
    await persistCauses(true);
  };

  const handleEditAvailability = async () => {
    await persistCauses(false);
    dispatch(setModalType(EDIT_SECTIONS.availability));
    dispatch(showModal());
  };

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogCausesContent}>
          <Causes
            isIndividual={true}
            onChange={handleCauseChange}
            currentUserCauses={updatedCauses}
            editMode
          />
        </div>
      </div>
      <div className={styles.profileDialogCausesFooter}>
        <label className={styles.profileDialogCheckboxLabel}>
          <Checkbox
            checked={areAllCausesSelected}
            onChange={handleToggleSelectAll}
            className={styles.profileDialogCheckbox}
            sx={{
              padding: 0,
              color: "#2C77E7",
              "&.Mui-checked": {
                color: "#2C77E7",
              },
              "& .MuiSvgIcon-root": {
                fontSize: 24,
              },
            }}
          />
          <span>Select All</span>
        </label>
        <div className={styles.profileDialogFooterActions}>
          <DarbeButton
            buttonText="Save"
            darbeButtonType="saveButton"
            onClick={handleSaveCauses}
          />
          <DarbeButton
            buttonText="Edit Availability"
            darbeButtonType="nextButton"
            onClick={handleEditAvailability}
          />
        </div>
      </div>
    </div>
  );
};
