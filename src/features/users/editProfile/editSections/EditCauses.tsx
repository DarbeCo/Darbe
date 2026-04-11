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
    const { textContent } = evt.target as HTMLButtonElement;
    if (!textContent) return;

    setUpdatedCauses((prevState) => {
      const isAlreadySelected = prevState.includes(textContent);

      if (isAlreadySelected) {
        return prevState.filter(
          (selectedCause) => selectedCause !== textContent
        );
      } else {
        return [...prevState, textContent];
      }
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
