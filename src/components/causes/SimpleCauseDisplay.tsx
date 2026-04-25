import { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";

import { useGetCausesQuery } from "../../services/api/endpoints/causes/causes.api";
import { DarbeButton } from "../buttons/DarbeButton";
import { useUpdateEntityProfileMutation } from "../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../../features/users/selectors";
import { updateUserCauses } from "../../features/users/userSlice";
import { hideModal } from "../modal/modalSlice";

import styles from "./styles/causesStyles.module.css";

interface SimpleCauseDisplayProps {
  externalData?: string[];
  userId?: string;
  canEdit?: boolean;
}

export const SimpleCauseDisplay = ({
  externalData = [],
  userId,
  canEdit = false,
}: SimpleCauseDisplayProps) => {
  const { data: causes, isLoading } = useGetCausesQuery();
  const [updateUserProfile] = useUpdateEntityProfileMutation();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const [selectedIds, setSelectedIds] = useState<string[]>(externalData);

  useEffect(() => {
    setSelectedIds(externalData);
  }, [externalData]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const visibleCauses = useMemo(() => {
    if (!causes) return [];
    if (canEdit) return causes;

    const selectedValues = new Set(selectedIds);
    return causes.filter(
      (cause) => selectedValues.has(cause.id) || selectedValues.has(cause.name)
    );
  }, [causes, canEdit, selectedIds]);

  const handleToggleCause = (causeId: string) => {
    if (!canEdit) return;
    setSelectedIds((prevState) =>
      prevState.includes(causeId)
        ? prevState.filter((id) => id !== causeId)
        : [...prevState, causeId]
    );
  };

  const handleSaveCauses = async () => {
    if (!userId) return;
    try {
      const payload = {
        user: { id: userId, causes: selectedIds },
      };
      const updatedUser = await updateUserProfile(payload).unwrap();

      if (updatedUser.user?.causes && userId === currentUserId) {
        dispatch(updateUserCauses(updatedUser.user.causes));
      }

      dispatch(hideModal());
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={
        canEdit ? styles.causesDisplay : styles.userCausesDialogContainer
      }
    >
      {isLoading ? (
        <CircularProgress />
      ) : canEdit ? (
        <>
          <div className={styles.causesContainer}>
            {visibleCauses.map((cause) => {
              const isSelected = selectedSet.has(cause.id);
              return (
                <DarbeButton
                  key={cause.id}
                  buttonText={cause.name}
                  darbeButtonType={isSelected ? "causesButtonBlue" : "causesButton"}
                  onClick={() => handleToggleCause(cause.id)}
                />
              );
            })}
          </div>
          {canEdit && (
            <DarbeButton
              buttonText="Save"
              darbeButtonType="saveButton"
              onClick={handleSaveCauses}
            />
          )}
        </>
      ) : (
        <div className={styles.userCausesScrollArea}>
          {visibleCauses.length > 0 ? (
            <div className={styles.userCausesGrid}>
              {visibleCauses.map((cause) => (
                <DarbeButton
                  key={cause.id}
                  buttonText={cause.name}
                  darbeButtonType="causesButtonBlue"
                  isDisabled
                />
              ))}
            </div>
          ) : (
            <div className={styles.noMutualCauses}>No causes selected</div>
          )}
        </div>
      )}
    </div>
  );
};
