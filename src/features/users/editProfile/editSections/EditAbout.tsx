import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId } from "../../selectors";

import { Typography } from "../../../../components/typography/Typography";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { Inputs } from "../../../../components/inputs/Inputs";
import { Dropdown } from "../../../../components/dropdowns/Dropdown";
import { Months } from "../../../../components/dropdowns/dropdownTypes/Months";
import { Years } from "../../../../components/dropdowns/dropdownTypes/Years";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { DarbeProfileSharedState } from "../../userSlice";
import { VolunteerExperienceState } from "../../userProfiles/types";
import { prepareData } from "../util";
import { UseDateParser } from "../../../../utils/commonHooks/UseDateParser";
import { useEditAboutInformation } from "../hooks";
import {
  hideModal,
  showModal,
  setModalType,
} from "../../../../components/modal/modalSlice";

import styles from "../styles/profileEdit.module.css";

export const EditAbout = () => {
  const userId = useAppSelector(selectCurrentUserId);

  const { editUserAboutState, editUserVolunteerExperiencesState } =
    useEditAboutInformation();

  const [formData, setFormData] =
    useState<Partial<DarbeProfileSharedState>>(editUserAboutState);
  const [volunteerExperiences, setVolunteerExperiences] =
    useState<VolunteerExperienceState>(editUserVolunteerExperiencesState);
  const { month: startMonth, year: startYear } = UseDateParser(
    volunteerExperiences.startDate
  );
  const { month: endMonth, year: endYear } = UseDateParser(
    volunteerExperiences.endDate
  );

  const dispatch = useAppDispatch();
  const [dates, setDates] = useState({
    startMonth,
    startYear,
    endMonth,
    endYear,
  });

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    const [key, subKey] = name.split(" ");

    if (key === "volunteerExperiences") {
      setVolunteerExperiences({
        ...volunteerExperiences,
        [subKey]: value,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const isFormDirty = () => {
    const isAboutMeDirty = formData.aboutMe !== editUserAboutState.aboutMe;
    const isVolunteerReasonDirty =
      formData.volunteerReason !== editUserAboutState.volunteerReason;
    const isVolunteerExperiencesDirty =
      volunteerExperiences.entityName !==
        editUserVolunteerExperiencesState.entityName ||
      volunteerExperiences.totalHours !==
        editUserVolunteerExperiencesState.totalHours ||
      volunteerExperiences.startDate !==
        editUserVolunteerExperiencesState.startDate ||
      volunteerExperiences.endDate !==
        editUserVolunteerExperiencesState.endDate;

    return (
      isAboutMeDirty || isVolunteerReasonDirty || isVolunteerExperiencesDirty
    );
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }
    dispatch(setModalType(EDIT_SECTIONS.background));
    dispatch(showModal());
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    setDates({ ...dates, [name]: value });
  };

  const prepareSubmission = () => {
    setVolunteerExperiences({
      ...volunteerExperiences,
      ...prepareData(dates, volunteerExperiences),
    });
  };

  const handleSave = () => {
    prepareSubmission();

    const payload = {
      ...formData,
      volunteerExperiences: [volunteerExperiences],
      user: { id: userId },
    };

    updateUserProfile(payload);
    dispatch(hideModal());
  };

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Typography variant="sectionTitle" textToDisplay="About Yourself" />
        <Inputs
          label="About"
          isRequired
          placeholder="Describe Yourself..."
          value={formData.aboutMe}
          name="aboutMe"
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Reason I Volunteer"
          value={formData.volunteerReason}
          isRequired
          placeholder="Why do you volunteer?"
          name="volunteerReason"
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
      </div>

      <div className={styles.editInputs}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Previous NP Experience"
        />
        <Inputs
          label="Non-Profit Name"
          isRequired
          value={volunteerExperiences.entityName}
          placeholder="Where did you volunteer?"
          name="volunteerExperiences entityName"
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Estimated Hours Volunteered"
          isRequired
          value={volunteerExperiences.totalHours}
          placeholder="How many hours?"
          name="volunteerExperiences totalHours"
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
      </div>

      <div className={styles.editDropdowns}>
        <div className={styles.editProfileDropdownArea}>
          <Dropdown
            label="Start Date"
            name="startMonth"
            initialValue={startMonth}
            autoWidth
            onChange={handleDropdownChange}
          >
            {Months()}
          </Dropdown>
          <Dropdown
            name="startYear"
            initialValue={startYear}
            autoWidth
            onChange={handleDropdownChange}
          >
            {Years()}
          </Dropdown>
        </div>
        <div className={styles.editProfileDropdownArea}>
          <Dropdown
            label="End Date"
            name="endMonth"
            initialValue={endMonth}
            onChange={handleDropdownChange}
          >
            {Months()}
          </Dropdown>
          <Dropdown
            name="endYear"
            initialValue={endYear}
            onChange={handleDropdownChange}
          >
            {Years()}
          </Dropdown>
        </div>
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        <DarbeButton
          buttonText="Occupation"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
