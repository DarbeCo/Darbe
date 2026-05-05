import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import {
  type Availability as EditAvailabilityState,
  DayOfWeek,
} from "../../../../services/types/availability.types";
import { Availability } from "../../../../components/availability/Availability";
import {
  hideModal,
  setModalType,
} from "../../../../components/modal/modalSlice";
import { useEditAvailabilityInformation } from "../hooks";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { selectCurrentUserId } from "../../selectors";
import { updateUserAvailability } from "../../userSlice";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { registerProfileEditAutosave } from "../profileEditAutosave";

import styles from "../styles/profileEdit.module.css";

export const EditAvailability = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const dispatch = useAppDispatch();
  const [updateUserProfile] = useUpdateUserProfileMutation();
  const { editUserAvailabilityState } = useEditAvailabilityInformation();
  const [newAvailability, setNewAvailability] = useState<EditAvailabilityState>(
    editUserAvailabilityState
  );

  // TODO: We use these in two spots, utilify?
  const updateAvailabilityData = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const dayOfWeek = name.split(" ")[1];
    const category = name.split(" ")[2];

    setNewAvailability((prevState) => {
      return {
        ...prevState,
        [dayOfWeek as DayOfWeek]: {
          ...prevState?.[dayOfWeek as DayOfWeek],
          [category]: value.toString(),
        },
      };
    });
  };

  const updateAvailabilityCheckbox = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = e.target;
    const dayOfWeek = name.split(" ")[1];
    setNewAvailability((prevState) => {
      return {
        ...prevState,
        [dayOfWeek as DayOfWeek]: {
          ...prevState?.[dayOfWeek as DayOfWeek],
          open: checked,
        },
      };
    });
  };

  const persistAvailability = async () => {
    const payload = {
      user: {
        id: userId,
        availability: newAvailability,
      },
    };

    const updatedUser = await updateUserProfile(payload).unwrap();

    if (updatedUser.user?.availability) {
      dispatch(updateUserAvailability(updatedUser.user.availability));
    }
  };

  const isAvailabilityDirty = () =>
    JSON.stringify(newAvailability) !== JSON.stringify(editUserAvailabilityState);

  const autosaveAvailability = async () => {
    if (!isAvailabilityDirty()) {
      return true;
    }

    try {
      await persistAvailability();
      return true;
    } catch (error) {
      console.error("Error autosaving Edit Availability", error);
      return false;
    }
  };

  useEffect(() => {
    return registerProfileEditAutosave(autosaveAvailability);
  }, [newAvailability, editUserAvailabilityState]);

  const handlePrevious = async () => {
    const didAutosave = await autosaveAvailability();

    if (didAutosave) {
      dispatch(setModalType(EDIT_SECTIONS.causes));
    }
  };

  const handleClose = async () => {
    const didAutosave = await autosaveAvailability();

    if (didAutosave) {
      dispatch(hideModal());
    }
  };

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogAvailabilityContent}>
          <Availability
            startingAvailability={newAvailability}
            onCheckboxChange={updateAvailabilityCheckbox}
            onAvailabilityChange={updateAvailabilityData}
            variant="profileDialog"
          />
        </div>
        <div className={styles.profileDialogBottomActions}>
          <DarbeButton
            buttonText="Previous"
            darbeButtonType="secondaryNextButton"
            onClick={handlePrevious}
          />
          <DarbeButton
            buttonText="Close"
            darbeButtonType="nextButton"
            onClick={handleClose}
          />
        </div>
      </div>
    </div>
  );
};
