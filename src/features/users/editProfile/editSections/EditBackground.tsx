import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { Years } from "../../../../components/dropdowns/dropdownTypes/Years";
import { Months } from "../../../../components/dropdowns/dropdownTypes/Months";
import { Dropdown } from "../../../../components/dropdowns/Dropdown";
import { Inputs } from "../../../../components/inputs/Inputs";
import { Typography } from "../../../../components/typography/Typography";
// import { CheckBox } from "../../../../components/checkbox/Checkbox";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { EducationState, JobExperienceState } from "../../userProfiles/types";
import { prepareData } from "../util";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useEditBackgroundInformation } from "../hooks";
import { UseDateParser } from "../../../../utils/commonHooks/UseDateParser";
import {
  showModal,
  hideModal,
  setModalType,
} from "../../../../components/modal/modalSlice";
import { selectCurrentUserId } from "../../selectors";

import styles from "../styles/profileEdit.module.css";

// TODO: split these up later too much state
// TODO: Do we even need checkboxes?
export const EditBackground = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const { editJobExperienceState, editEducationExperienceState } =
    useEditBackgroundInformation();

  const [jobExperience, setJobExperience] = useState<JobExperienceState>(
    editJobExperienceState
  );

  const { month: jobStartMonth, year: jobStartYear } = UseDateParser(
    jobExperience.startDate
  );
  const { month: jobEndMonth, year: jobEndYear } = UseDateParser(
    jobExperience.endDate
  );

  const [educationExperience, setEducationExperience] =
    useState<EducationState>(editEducationExperienceState);

  const { month: educationStartMonth, year: educationStartYear } =
    UseDateParser(educationExperience.startDate);
  const { month: educationEndMonth, year: educationEndYear } = UseDateParser(
    educationExperience.endDate
  );

  const [jobDates, setJobDates] = useState({
    startMonth: jobStartMonth,
    startYear: jobStartYear,
    endMonth: jobEndMonth,
    endYear: jobEndYear,
  });

  const [educationDates, setEducationDates] = useState({
    startMonth: educationStartMonth,
    startYear: educationStartYear,
    endMonth: educationEndMonth,
    endYear: educationEndYear,
  });

  const dispatch = useAppDispatch();

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    const [key, subKey] = name.split(" ");

    if (key === "job") {
      setJobExperience({
        ...jobExperience,
        [subKey]: value,
      });
    } else {
      setEducationExperience({
        ...educationExperience,
        [subKey]: value,
      });
    }
  };

  const isFormDirty = () => {
    const isJobDirty =
      jobExperience.jobTitle !== editJobExperienceState.jobTitle ||
      jobExperience.entityName !== editJobExperienceState.entityName ||
      jobExperience.startDate !== editJobExperienceState.startDate ||
      jobExperience.endDate !== editJobExperienceState.endDate;

    const isEducationDirty =
      educationExperience.schoolName !==
        editEducationExperienceState.schoolName ||
      educationExperience.degree !== editEducationExperienceState.degree ||
      educationExperience.startDate !==
        editEducationExperienceState.startDate ||
      educationExperience.endDate !== editEducationExperienceState.endDate;

    return isJobDirty || isEducationDirty;
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }
    dispatch(setModalType(EDIT_SECTIONS.military));
    dispatch(showModal());
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    const [key, subKey] = name.split(" ");

    if (key === "job") {
      setJobDates({
        ...jobDates,
        [subKey]: value,
      });
    } else {
      setEducationDates({
        ...educationDates,
        [subKey]: value,
      });
    }
  };

  // TODO: Figure out if we really need the checkbox stuff
  // const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.checked });
  // };

  const prepareSubmission = () => {
    setJobExperience({
      ...jobExperience,
      ...prepareData(jobDates, jobExperience),
    });
    setEducationExperience({
      ...educationExperience,
      ...prepareData(educationDates, educationExperience),
    });
  };

  const handleSave = () => {
    prepareSubmission();

    const payload = {
      jobExperiences: [jobExperience],
      education: [educationExperience],
      user: { id: userId },
    };

    updateUserProfile(payload);
    dispatch(hideModal());
  };

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Typography variant="sectionTitle" textToDisplay="Occupation" />
        <Inputs
          label="Title"
          isRequired
          placeholder="What did you do?"
          name="job jobTitle"
          value={jobExperience.jobTitle}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Company"
          isRequired
          placeholder="Where did you work?"
          name="job entityName"
          value={jobExperience.entityName}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <div className={styles.editProfileDropdownAreaFullWidth}>
          <Dropdown
            label="Start Date"
            name="job startMonth"
            initialValue={jobDates.startMonth}
            onChange={handleDropdownChange}
          >
            {Months()}
          </Dropdown>
          <Dropdown
            name="job startYear"
            initialValue={jobDates.startYear}
            onChange={handleDropdownChange}
          >
            {Years()}
          </Dropdown>
        </div>
        <div className={styles.editProfileDropdownAreaFullWidth}>
          <Dropdown
            label="End Date"
            name="job endMonth"
            initialValue={jobDates.endMonth}
            onChange={handleDropdownChange}
          >
            {Months()}
          </Dropdown>
          <Dropdown
            name="job endYear"
            initialValue={jobDates.endYear}
            onChange={handleDropdownChange}
          >
            {Years()}
          </Dropdown>
        </div>
        {/* <CheckBox
          name="currentlyWorking"
          label="Currently Working"
          onChange={handleCheckboxChange}
          labelPlacement="right"
          boxPlacement="right"
        /> */}
      </div>

      <div className={styles.editInputs}>
        <Typography variant="sectionTitle" textToDisplay="Education" />
        <Inputs
          label="Institution Name"
          isRequired
          placeholder="Where did you study?"
          name="education schoolName"
          value={educationExperience.schoolName}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Institution Major"
          isRequired
          placeholder="What did you study?"
          name="education degree"
          value={educationExperience.degree}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <div className={styles.editProfileDropdownAreaFullWidth}>
          <Dropdown
            label="Start Date"
            name="education startMonth"
            initialValue={educationDates.startMonth}
            onChange={handleDropdownChange}
          >
            {Months()}
          </Dropdown>
          <Dropdown
            name="education startYear"
            initialValue={educationDates.startYear}
            onChange={handleDropdownChange}
          >
            {Years()}
          </Dropdown>
        </div>
        <div className={styles.editProfileDropdownAreaFullWidth}>
          <Dropdown
            label="End Date"
            initialValue={educationDates.endMonth}
            name="education endMonth"
            onChange={handleDropdownChange}
          >
            {Months()}
          </Dropdown>
          <Dropdown
            name="education endYear"
            initialValue={educationDates.endYear}
            onChange={handleDropdownChange}
          >
            {Years()}
          </Dropdown>
        </div>
        {/* <CheckBox
          name="currentlyAttending"
          label="Currently Attending"
          onChange={handleCheckboxChange}
          labelPlacement="right"
          boxPlacement="right"
        /> */}
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        <DarbeButton
          buttonText="Military"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
