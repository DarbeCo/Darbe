import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
// import { CheckBox } from "../../../../components/checkbox/Checkbox";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { EducationState, JobExperienceState } from "../../userProfiles/types";
import { prepareData } from "../util";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useEditBackgroundInformation } from "../hooks";
import { UseDateParser } from "../../../../utils/commonHooks/UseDateParser";
import { hideModal } from "../../../../components/modal/modalSlice";
import { selectCurrentUserId } from "../../selectors";
import {
  EDIT_PROFILE_ROUTE,
  PROFILE_ROUTE,
} from "../../../../routes/route.constants";
import { setUserProfile } from "../../userSlice";

import styles from "../styles/profileEdit.module.css";

const MONTH_OPTIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const YEAR_OPTIONS = Array.from({ length: 101 }, (_, index) =>
  `${new Date().getFullYear() - index}`
);
const PROFILE_TEXT_MAX_LENGTH = 300;

type TextFieldProps = {
  label: string;
  name: string;
  value?: string;
  placeholder: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type SelectFieldProps = {
  label: string;
  name: string;
  value?: string;
  placeholder: string;
  required?: boolean;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const TextField = ({
  label,
  name,
  value = "",
  placeholder,
  required = false,
  onChange,
}: TextFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textValue = value?.toString() ?? "";

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [textValue]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className={styles.profileDialogField}>
      <label className={styles.profileDialogLabel}>
        {label}
        {required && <span className={styles.profileDialogRequired}>*</span>}
      </label>
      <textarea
        className={`${styles.profileDialogTextarea} ${
          styles.profileAboutTextarea
        } ${textValue ? styles.profileDialogFieldFilled : ""}`.trim()}
        maxLength={PROFILE_TEXT_MAX_LENGTH}
        name={name}
        onChange={handleTextChange}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={textValue}
      />
      <div className={styles.profileDialogCounter}>
        {textValue.length}/{PROFILE_TEXT_MAX_LENGTH}
      </div>
    </div>
  );
};

const SelectField = ({
  label,
  name,
  value = "",
  placeholder,
  required = false,
  options,
  onChange,
}: SelectFieldProps) => (
  <div className={styles.profileDialogField}>
    <label className={styles.profileDialogLabel}>
      {label}
      {required && <span className={styles.profileDialogRequired}>*</span>}
    </label>
    <select
      className={`${styles.profileDialogSelect} ${
        value ? styles.profileDialogFieldFilled : ""
      }`.trim()}
      name={name}
      onChange={onChange}
      value={value}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

type DateFieldProps = {
  label: string;
  monthName: string;
  monthValue?: string;
  yearName: string;
  yearValue?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const DateField = ({
  label,
  monthName,
  monthValue = "",
  yearName,
  yearValue = "",
  required = true,
  onChange,
}: DateFieldProps) => (
  <div className={styles.profileDialogField}>
    <span className={styles.profileDialogLabel}>
      {label}
      {required && <span className={styles.profileDialogRequired}>*</span>}
    </span>
    <div className={styles.profileDateSelectRow}>
      <select
        className={`${styles.profileDialogSelect} ${
          monthValue ? styles.profileDialogFieldFilled : ""
        }`.trim()}
        name={monthName}
        onChange={onChange}
        value={monthValue}
      >
        <option value="">Month</option>
        {MONTH_OPTIONS.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
      <select
        className={`${styles.profileDialogSelect} ${
          yearValue ? styles.profileDialogFieldFilled : ""
        }`.trim()}
        name={yearName}
        onChange={onChange}
        value={yearValue}
      >
        <option value="">Year</option>
        {YEAR_OPTIONS.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  </div>
);

// TODO: split these up later too much state
// TODO: Do we even need checkboxes?
export const EditBackground = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const navigate = useNavigate();
  const { editJobExperienceState, editEducationExperienceState } =
    useEditBackgroundInformation();
  const [occupationType, setOccupationType] = useState("");
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [currentlyAttending, setCurrentlyAttending] = useState(false);

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

  const handleNextSection = async () => {
    if (isFormDirty()) {
      await handleSave();
    }
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.military}`);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    const [key, subKey] = name.split(" ");

    if (name === "occupationType") {
      setOccupationType(value);
    } else if (key === "job") {
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

  const handleSave = async () => {
    const preparedJobExperience = prepareData(
      jobDates,
      { ...jobExperience }
    ) as JobExperienceState;
    const preparedEducationExperience = prepareData(
      educationDates,
      { ...educationExperience }
    ) as EducationState;

    const payload = {
      jobExperiences: [preparedJobExperience],
      education: [preparedEducationExperience],
      user: { id: userId },
    };

    const updatedUser = await updateUserProfile(payload).unwrap();
    dispatch(setUserProfile(updatedUser));
    dispatch(hideModal());
  };

  const handleSaveAndReturnToProfile = async () => {
    await handleSave();
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileAboutForm}>
          <h2 className={styles.profileEditSectionTitle}>Occupation</h2>
          <div className={styles.profileOccupationFirstRow}>
            <SelectField
              label="Occupational Type"
              required
              placeholder="Type"
              name="occupationType"
              value={occupationType}
              options={["Full-time", "Part-time", "Contract", "Volunteer"]}
              onChange={handleDropdownChange}
            />
            <TextField
              label="Title"
              required
              placeholder="What do you do?"
              name="job jobTitle"
              value={jobExperience.jobTitle}
              onChange={handleChange}
            />
          </div>
          <TextField
            label="Company"
            required
            placeholder="Where do you work?"
            name="job entityName"
            value={jobExperience.entityName}
            onChange={handleChange}
          />
          <DateField
            label="Start Date"
            monthName="job startMonth"
            monthValue={jobDates.startMonth}
            yearName="job startYear"
            yearValue={jobDates.startYear}
            onChange={handleDropdownChange}
          />
          <DateField
            label="End Date"
            monthName="job endMonth"
            monthValue={jobDates.endMonth}
            yearName="job endYear"
            yearValue={jobDates.endYear}
            onChange={handleDropdownChange}
          />
          <label className={styles.profileDialogCheckboxLabel}>
            <input
              className={styles.profileDialogCheckbox}
              checked={currentlyWorking}
              onChange={(event) => setCurrentlyWorking(event.target.checked)}
              type="checkbox"
            />
            Currently Working
          </label>

          <h2 className={styles.profileEditSectionTitle}>Education</h2>
          <TextField
            label="Institution Name"
            required
            placeholder="Where did you study?"
            name="education schoolName"
            value={educationExperience.schoolName}
            onChange={handleChange}
          />
          <TextField
            label="Institution Major"
            required
            placeholder="What did you study?"
            name="education degree"
            value={educationExperience.degree}
            onChange={handleChange}
          />
          <DateField
            label="Start Date"
            monthName="education startMonth"
            monthValue={educationDates.startMonth}
            yearName="education startYear"
            yearValue={educationDates.startYear}
            onChange={handleDropdownChange}
          />
          <DateField
            label="End Date"
            monthName="education endMonth"
            monthValue={educationDates.endMonth}
            yearName="education endYear"
            yearValue={educationDates.endYear}
            onChange={handleDropdownChange}
          />
          <label className={styles.profileDialogCheckboxLabel}>
            <input
              className={styles.profileDialogCheckbox}
              checked={currentlyAttending}
              onChange={(event) => setCurrentlyAttending(event.target.checked)}
              type="checkbox"
            />
            Currently Attending
          </label>
        </div>
      </div>

      <div className={styles.profileDialogFooter}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSaveAndReturnToProfile}
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
