import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { Typography } from "../../../../components/typography/Typography";
import { Dropdown } from "../../../../components/dropdowns/Dropdown";
import { MilitaryStatus } from "../../../../components/dropdowns/dropdownTypes/MilitaryStatus";
import { MilitaryRank } from "../../../../components/dropdowns/dropdownTypes/MilitaryRanks";
import { MilitaryBranches } from "../../../../components/dropdowns/dropdownTypes/MilitaryBranches";
import { MilitaryServiceState } from "../../userProfiles/types";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useEditMilitaryInformation } from "../hooks";
import {
  showModal,
  hideModal,
  setModalType,
} from "../../../../components/modal/modalSlice";
import { selectCurrentUserId } from "../../selectors";

import styles from "../styles/profileEdit.module.css";

export const EditMilitary = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const { editMilitaryState } = useEditMilitaryInformation();

  const dispatch = useAppDispatch();
  const [formData, setFormData] =
    useState<MilitaryServiceState>(editMilitaryState);
  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const payload = {
      militaryService: [formData],
      user: { id: userId },
    };

    updateUserProfile(payload);
    dispatch(hideModal());
  };

  const isFormDirty = () => {
    return (
      formData.branch !== editMilitaryState.branch ||
      formData.rank !== editMilitaryState.rank ||
      formData.status !== editMilitaryState.status
    );
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }
    dispatch(setModalType(EDIT_SECTIONS.qualifications));
    dispatch(showModal());
  };

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Typography variant="sectionTitle" textToDisplay="Military" />
        <Dropdown
          name="branch"
          label="Branch"
          initialValue={formData.branch}
          onChange={handleDropdownChange}
          showClearOption
        >
          {MilitaryBranches()}
        </Dropdown>
        <Dropdown
          name="rank"
          label="Rank"
          initialValue={formData.rank}
          onChange={handleDropdownChange}
          autoWidth={false}
        >
          {MilitaryRank(formData.branch)}
        </Dropdown>
        <Dropdown
          name="status"
          label="Status"
          initialValue={formData.status}
          onChange={handleDropdownChange}
        >
          {MilitaryStatus()}
        </Dropdown>
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        <DarbeButton
          buttonText="Licenses"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
