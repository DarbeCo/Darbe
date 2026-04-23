import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId } from "../../selectors";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { DarbeProfileSharedState } from "../../userSlice";
import { VolunteerExperienceState } from "../../userProfiles/types";
import { prepareData } from "../util";
import { UseDateParser } from "../../../../utils/commonHooks/UseDateParser";
import { useEditAboutInformation } from "../hooks";
import { hideModal } from "../../../../components/modal/modalSlice";
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

const ABOUT_MAX_LENGTH = 300;

type AutoGrowFieldProps = {
  label: string;
  value?: string | number;
  placeholder: string;
  name: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const AutoGrowField = ({
  label,
  value,
  placeholder,
  name,
  required = false,
  onChange,
}: AutoGrowFieldProps) => {
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

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className={`${styles.profileDialogField} ${styles.profileAboutField}`}>
      <label className={styles.profileDialogLabel}>
        {label}
        {required && <span className={styles.profileDialogRequired}>*</span>}
      </label>
      <textarea
        ref={textareaRef}
        className={`${styles.profileDialogTextarea} ${styles.profileAboutTextarea} ${
          textValue ? styles.profileDialogFieldFilled : ""
        }`.trim()}
        maxLength={ABOUT_MAX_LENGTH}
        name={name}
        onChange={handleChange}
        placeholder={placeholder}
        rows={1}
        value={textValue}
      />
      <div className={styles.profileDialogCounter}>
        {textValue.length}/{ABOUT_MAX_LENGTH}
      </div>
    </div>
  );
};

type DateRowProps = {
  label: string;
  monthName: string;
  monthValue?: string;
  yearName: string;
  yearValue?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const DateRow = ({
  label,
  monthName,
  monthValue = "",
  yearName,
  yearValue = "",
  onChange,
}: DateRowProps) => (
  <div className={`${styles.profileDialogField} ${styles.profileAboutDateField}`}>
    <span className={styles.profileDialogLabel}>
      {label}
      <span className={styles.profileDialogRequired}>*</span>
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

export const EditAbout = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const navigate = useNavigate();

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
  const [saveError, setSaveError] = useState("");

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

  const handleNextSection = async () => {
    if (isFormDirty()) {
      const didSave = await handleSave();

      if (!didSave) {
        return;
      }
    }
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.background}`);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    setDates({ ...dates, [name]: value });
  };

  const validateForm = () => {
    if (!formData.aboutMe?.trim()) {
      return "About is required.";
    }

    if (!formData.volunteerReason?.trim()) {
      return "Why I volunteer is required.";
    }

    if (!volunteerExperiences.entityName?.trim()) {
      return "Non-Profit Name is required.";
    }

    if (
      volunteerExperiences.totalHours === undefined ||
      volunteerExperiences.totalHours === null ||
      volunteerExperiences.totalHours.toString().trim() === "" ||
      Number.isNaN(Number(volunteerExperiences.totalHours))
    ) {
      return "Estimated Hours Volunteered must be a number.";
    }

    if (!dates.startMonth || !dates.startYear) {
      return "Start Date is required.";
    }

    if (!dates.endMonth || !dates.endYear) {
      return "End Date is required.";
    }

    return "";
  };

  const handleSave = async () => {
    const error = validateForm();

    if (error) {
      setSaveError(error);
      return false;
    }

    setSaveError("");

    const preparedVolunteerExperience = prepareData(
      dates,
      {
        ...volunteerExperiences,
        totalHours: Number(volunteerExperiences.totalHours),
      }
    ) as VolunteerExperienceState;

    const payload = {
      ...formData,
      volunteerExperiences: [preparedVolunteerExperience],
      user: { id: userId },
    };

    try {
      const updatedUser = await updateUserProfile(payload).unwrap();
      dispatch(setUserProfile(updatedUser));
      dispatch(hideModal());
      return true;
    } catch (error) {
      console.error("Error saving Edit About", error);
      setSaveError("Unable to save Edit About. Please try again.");
      return false;
    }
  };

  const handleSaveAndReturnToProfile = async () => {
    const didSave = await handleSave();

    if (didSave) {
      navigate(`${PROFILE_ROUTE}/${userId}`);
    }
  };

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={`${styles.profileAboutForm} ${styles.profileAboutExactForm}`}>
          <h2 className={styles.profileEditSectionTitle}>About yourself</h2>
          <AutoGrowField
            label="About"
            required
            placeholder="Describe yourself..."
            value={formData.aboutMe}
            name="aboutMe"
            onChange={handleChange}
          />
          <AutoGrowField
            label="Why I volunteer"
            required
            value={formData.volunteerReason}
            placeholder="Why do you volunteer?"
            name="volunteerReason"
            onChange={handleChange}
          />

          <h2 className={styles.profileEditSectionTitle}>
            Previous NP Experience
          </h2>
          <AutoGrowField
            label="Non-Profit Name"
            required
            value={volunteerExperiences.entityName}
            placeholder="Where do you work?"
            name="volunteerExperiences entityName"
            onChange={handleChange}
          />
          <AutoGrowField
            label="Estimated Hours Volunteered"
            required
            value={volunteerExperiences.totalHours}
            placeholder="Hours Volunteer?"
            name="volunteerExperiences totalHours"
            onChange={handleChange}
          />

          <DateRow
            label="Start Date"
            monthName="startMonth"
            monthValue={dates.startMonth}
            yearName="startYear"
            yearValue={dates.startYear}
            onChange={handleDropdownChange}
          />
          <DateRow
            label="End Date"
            monthName="endMonth"
            monthValue={dates.endMonth}
            yearName="endYear"
            yearValue={dates.endYear}
            onChange={handleDropdownChange}
          />
        </div>
      </div>

      {saveError && <p className={styles.profileDialogError}>{saveError}</p>}

      <div className={`${styles.profileDialogFooter} ${styles.profileAboutFooter}`}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSaveAndReturnToProfile}
        />
        <DarbeButton
          buttonText="Add Occupation"
          darbeButtonType="nextButton"
          endingIconPath="/svgs/common/goForwardIconWhite.svg"
          onClick={handleNextSection}
        />
      </div>
    </div>
  );
};
