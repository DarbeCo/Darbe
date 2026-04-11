import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { useNavigate } from "react-router-dom";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import {
  type Availability as EditAvailabilityState,
  DayOfWeek,
} from "../../../../services/types/availability.types";
import { PROFILE_ROUTE } from "../../../../routes/route.constants";
import { Availability } from "../../../../components/availability/Availability";
import { hideModal } from "../../../../components/modal/modalSlice";
import { useEditAvailabilityInformation } from "../hooks";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { selectCurrentUserId } from "../../selectors";
import { updateUserAvailability } from "../../userSlice";

import styles from "../styles/profileEdit.module.css";

export const EditAvailability = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const navigate = useNavigate();
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
          ...newAvailability?.[dayOfWeek as DayOfWeek],
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
          ...newAvailability?.[dayOfWeek as DayOfWeek],
          open: checked,
        },
      };
    });
  };

  const handleSave = async () => {
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

    navigate(`${PROFILE_ROUTE}/${userId}`);
    dispatch(hideModal());
  };

  return (
    <div className={styles.profileEditContentAvailability}>
      <Availability
        startingAvailability={newAvailability}
        onCheckboxChange={updateAvailabilityCheckbox}
        onAvailabilityChange={updateAvailabilityData}
      />

      <DarbeButton
        buttonText="Save"
        darbeButtonType="saveButton"
        onClick={handleSave}
      />
    </div>
  );
};
