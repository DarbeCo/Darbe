import { useState } from "react";

import { Causes } from "../../../../components/causes/Causes";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserCauses, selectCurrentUserId } from "../../selectors";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserCauses } from "../../userSlice";
import { hideModal } from "../../../../components/modal/modalSlice";

import styles from "../styles/profileEdit.module.css";

export const EditCauses = () => {
  const dispatch = useAppDispatch();
  const currentCauses = useAppSelector(selectCurrentUserCauses);
  const userId = useAppSelector(selectCurrentUserId);
  const [updateUserProfile] = useUpdateEntityProfileMutation();
  const [updatedCauses, setUpdatedCauses] = useState<string[]>(currentCauses);

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

  const handleSaveCauses = async () => {
    const payload = {
      user: { id: userId, causes: updatedCauses },
    };

    const updatedUser = await updateUserProfile(payload).unwrap();

    if (updatedUser.user?.causes) {
      dispatch(updateUserCauses(updatedUser.user.causes));
    }
    
    dispatch(hideModal());
  };

  return (
    <div className={styles.profileEditContentCauses}>
      <Causes
        isIndividual={true}
        onChange={handleCauseChange}
        currentUserCauses={currentCauses}
        editMode
      />
      <DarbeButton
        buttonText="Save"
        darbeButtonType="saveButton"
        onClick={handleSaveCauses}
      />
    </div>
  );
};
