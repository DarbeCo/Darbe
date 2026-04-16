import { useState } from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import {
  getModalStatus,
  getModalType,
} from "../../../../components/modal/selectors";
import {
  hideModal,
  setModalType,
  showModal,
} from "../../../../components/modal/modalSlice";
import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { DarbeProfileSharedState } from "../../userSlice";
import { useEditProfileInformation } from "../hooks";

import styles from "../styles/profileEdit.module.css";

type DateOfBirthFields = {
  month: string;
  day: string;
  year: string;
};

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

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-Binary",
  "Transgender",
  "Prefer not to answer",
];

const RACE_OPTIONS = [
  "American Indian or Alaskan Native",
  "Black or African American",
  "Asian",
  "Hispanic or Latino",
  "Native Hawaiian or Pacific Islander",
  "White",
  "Prefer not to answer",
];

const emptyDateOfBirth = (): DateOfBirthFields => ({
  month: "",
  day: "",
  year: "",
});

const parseDateOfBirth = (value?: string): DateOfBirthFields => {
  if (!value) {
    return emptyDateOfBirth();
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return emptyDateOfBirth();
  }

  return {
    month: MONTH_OPTIONS[date.getUTCMonth()] ?? "",
    day: date.getUTCDate().toString(),
    year: date.getUTCFullYear().toString(),
  };
};

const formatDateOfBirth = (value: DateOfBirthFields): string | undefined => {
  if (!value.year || !value.month || !value.day) {
    return undefined;
  }

  const monthIndex = MONTH_OPTIONS.indexOf(value.month);
  if (monthIndex === -1) {
    return undefined;
  }

  const month = `${monthIndex + 1}`.padStart(2, "0");
  const day = value.day.padStart(2, "0");

  return `${value.year}-${month}-${day}`;
};

const buildLocationValue = (city?: string, state?: string) =>
  [city, state].filter(Boolean).join(", ");

const parseLocationValue = (value: string, fallbackState?: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      city: "",
      state: "",
    };
  }

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return {
      city: parts[0],
      state: fallbackState ?? "",
    };
  }

  return {
    city: parts.slice(0, -1).join(", "),
    state: parts[parts.length - 1],
  };
};

const getCount = (value?: string) => value?.length ?? 0;

type TextFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  maxLength?: number;
  required?: boolean;
  readOnly?: boolean;
  type?: string;
  className?: string;
  textarea?: boolean;
};

const ProfileTextField = ({
  label,
  value = "",
  placeholder,
  onChange,
  maxLength,
  required = true,
  readOnly = false,
  type = "text",
  className,
  textarea = false,
}: TextFieldProps) => {
  const inputClassName = `${
    textarea ? styles.profileDialogTextarea : styles.profileDialogInput
  } ${value ? styles.profileDialogFieldFilled : ""}`.trim();

  const inputProps = {
    className: inputClassName,
    placeholder,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value),
    maxLength,
    readOnly,
  };

  return (
    <div className={`${styles.profileDialogField} ${className ?? ""}`.trim()}>
      <label className={styles.profileDialogLabel}>
        {label}
        {required && <span className={styles.profileDialogRequired}>*</span>}
      </label>
      {textarea ? (
        <textarea {...inputProps} rows={3} />
      ) : (
        <input {...inputProps} type={type} />
      )}
      {typeof maxLength === "number" && (
        <div className={styles.profileDialogCounter}>
          {getCount(value)}/{maxLength}
        </div>
      )}
    </div>
  );
};

type SelectFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  className?: string;
  showLabel?: boolean;
};

type CustomSelectFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
  hasValue?: boolean;
  menuPaperClassName?: string;
  menuListClassName?: string;
};

const ProfileSelectField = ({
  label,
  value = "",
  onChange,
  options,
  placeholder,
  required = true,
  className,
  showLabel = true,
}: SelectFieldProps) => (
  <div className={`${styles.profileDialogField} ${className ?? ""}`.trim()}>
    {showLabel && (
      <label className={styles.profileDialogLabel}>
        {label}
        {required && <span className={styles.profileDialogRequired}>*</span>}
      </label>
    )}
    <ProfileMuiSelectField
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      hasValue={Boolean(value)}
      menuPaperClassName={styles.profileDialogMenuPaper}
      menuListClassName={styles.profileDialogMenuList}
    />
  </div>
);

const ProfileMuiSelectField = ({
  value = "",
  onChange,
  options,
  placeholder,
  className,
  hasValue = false,
  menuPaperClassName,
  menuListClassName,
}: CustomSelectFieldProps) => (
  <div className={`${styles.profileDialogField} ${className ?? ""}`.trim()}>
    <Select
      displayEmpty
      value={value}
      onChange={(event: SelectChangeEvent<string>) => onChange(event.target.value)}
      className={`${styles.profileDialogMuiSelect} ${
        hasValue ? styles.profileDialogFieldFilled : ""
      }`.trim()}
      MenuProps={{
        PaperProps: {
          className: menuPaperClassName,
        },
        MenuListProps: {
          className: menuListClassName,
        },
      }}
      renderValue={(selected) =>
        selected ? (
          selected
        ) : (
          <span className={styles.profileDialogSelectPlaceholder}>
            {placeholder}
          </span>
        )
      }
    >
      <MenuItem value="">{placeholder}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  </div>
);

export const EditProfileInfo = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const { user } = useAppSelector(selectUser);
  const isModalOpen = useAppSelector(getModalStatus);
  const modalType = useAppSelector(getModalType);
  const editProfileState = useEditProfileInformation();
  const [formData, setFormData] =
    useState<Partial<DarbeProfileSharedState>>(editProfileState);
  const [location, setLocation] = useState(
    buildLocationValue(editProfileState.user?.city, editProfileState.state)
  );
  const [dateOfBirth, setDateOfBirth] = useState<DateOfBirthFields>(
    parseDateOfBirth(editProfileState.user?.dateOfBirth)
  );
  const [titlePrefix, setTitlePrefix] = useState(editProfileState.title ?? "");

  const [updateUserProfile] = useUpdateUserProfileMutation();
  const dispatch = useAppDispatch();
  const isProfileDialog = isModalOpen && modalType === EDIT_SECTIONS.profile;

  const setUserField = (
    field:
      | "firstName"
      | "lastName"
      | "city"
      | "zip"
      | "dateOfBirth"
      | "ein"
      | "nonprofitName"
      | "organizationName",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        [field]: value,
      },
    }));
  };

  const setProfileField = (
    field:
      | "tagLine"
      | "gender"
      | "race"
      | "allergies"
      | "phoneNumber"
      | "state",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setEmergencyField = (
    field: "name" | "phone" | "relation",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  const buildPayload = (): Partial<DarbeProfileSharedState> => {
    const parsedLocation = parseLocationValue(location, formData.state);
    const formattedDateOfBirth = formatDateOfBirth(dateOfBirth);

    return {
      ...formData,
      title: titlePrefix,
      state: parsedLocation.state,
      user: {
        ...formData.user,
        id: userId,
        city: parsedLocation.city,
        dateOfBirth: formattedDateOfBirth,
      },
      emergencyContact: {
        name: formData.emergencyContact?.name ?? "",
        phone: formData.emergencyContact?.phone ?? "",
        relation: formData.emergencyContact?.relation ?? "",
      },
    };
  };

  const persistProfile = async (shouldClose: boolean) => {
    await updateUserProfile(buildPayload());

    if (shouldClose) {
      dispatch(hideModal());
    }
  };

  const initialLocation = buildLocationValue(
    editProfileState.user?.city,
    editProfileState.state
  );
  const initialDateOfBirth = parseDateOfBirth(editProfileState.user?.dateOfBirth);

  const isFormDirty = () =>
    JSON.stringify(formData) !== JSON.stringify(editProfileState) ||
    location !== initialLocation ||
    JSON.stringify(dateOfBirth) !== JSON.stringify(initialDateOfBirth) ||
    titlePrefix !== (editProfileState.title ?? "");

  const handleSave = async () => {
    await persistProfile(true);
  };

  const handleSecondaryAction = async () => {
    if (isFormDirty()) {
      await persistProfile(false);
    }

    if (isProfileDialog) {
      dispatch(setModalType(EDIT_SECTIONS.causes));
      return;
    }

    dispatch(setModalType(EDIT_SECTIONS.availability));
    dispatch(showModal());
  };

  if (user?.userType !== "individual") {
    return null;
  }

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileDialogGrid}>
          <ProfileTextField
            label="First Name"
            placeholder="John"
            value={formData.user?.firstName}
            onChange={(value) => setUserField("firstName", value)}
            maxLength={50}
          />
          <ProfileTextField
            label="Last Name"
            placeholder="Smith"
            value={formData.user?.lastName}
            onChange={(value) => setUserField("lastName", value)}
            maxLength={50}
          />
          <ProfileTextField
            label="Location"
            placeholder="Houston, TX"
            value={location}
            onChange={setLocation}
            maxLength={300}
          />
          <ProfileTextField
            label="Zip Code"
            placeholder="77001"
            value={formData.user?.zip}
            onChange={(value) => setUserField("zip", value)}
            maxLength={50}
          />
          <div className={styles.profileDialogFieldFullWidth}>
            <label className={styles.profileDialogLabel}>
              Date Of Birth
              <span className={styles.profileDialogRequired}>*</span>
            </label>
            <div className={styles.profileDialogDobRow}>
              <ProfileMuiSelectField
                placeholder="Month"
                value={dateOfBirth.month}
                onChange={(value) =>
                  setDateOfBirth((prev) => ({ ...prev, month: value }))
                }
                options={MONTH_OPTIONS}
                className={styles.profileDialogCompactField}
                hasValue={Boolean(dateOfBirth.month)}
                menuPaperClassName={styles.profileDialogDateMenuPaper}
                menuListClassName={styles.profileDialogDateMenuList}
              />
              <ProfileMuiSelectField
                placeholder="Day"
                value={dateOfBirth.day}
                onChange={(value) =>
                  setDateOfBirth((prev) => ({ ...prev, day: value }))
                }
                options={Array.from({ length: 31 }, (_, index) =>
                  `${index + 1}`
                )}
                className={styles.profileDialogCompactField}
                hasValue={Boolean(dateOfBirth.day)}
                menuPaperClassName={styles.profileDialogDateMenuPaper}
                menuListClassName={styles.profileDialogDateMenuList}
              />
              <ProfileMuiSelectField
                placeholder="Year"
                value={dateOfBirth.year}
                onChange={(value) =>
                  setDateOfBirth((prev) => ({ ...prev, year: value }))
                }
                options={Array.from({ length: 101 }, (_, index) =>
                  `${new Date().getFullYear() - index}`
                )}
                className={styles.profileDialogCompactField}
                hasValue={Boolean(dateOfBirth.year)}
                menuPaperClassName={styles.profileDialogDateMenuPaper}
                menuListClassName={styles.profileDialogDateMenuList}
              />
            </div>
          </div>
          <ProfileTextField
            label="Tagline"
            placeholder="Volunteer at NP"
            value={formData.tagLine}
            onChange={(value) => setProfileField("tagLine", value)}
            maxLength={300}
            className={styles.profileDialogFieldFullWidth}
          />
          <ProfileTextField
            label="Title / Prefix"
            placeholder="Mr."
            value={titlePrefix}
            onChange={setTitlePrefix}
            maxLength={50}
            className={styles.profileDialogFieldFullWidth}
          />
          <ProfileSelectField
            label="Gender"
            placeholder="Select gender"
            value={formData.gender}
            onChange={(value) => setProfileField("gender", value)}
            options={GENDER_OPTIONS}
          />
          <ProfileSelectField
            label="Race"
            placeholder="Select race"
            value={formData.race}
            onChange={(value) => setProfileField("race", value)}
            options={RACE_OPTIONS}
          />
          <ProfileTextField
            label="Emergency Contact Name"
            placeholder="Karen Smith"
            value={formData.emergencyContact?.name}
            onChange={(value) => setEmergencyField("name", value)}
            maxLength={50}
          />
          <ProfileTextField
            label="Relationship"
            placeholder="Sister"
            value={formData.emergencyContact?.relation}
            onChange={(value) => setEmergencyField("relation", value)}
            maxLength={20}
          />
          <ProfileTextField
            label="Phone Number"
            placeholder="123-456-7890"
            value={formData.phoneNumber}
            onChange={(value) => setProfileField("phoneNumber", value)}
            maxLength={50}
          />
          <ProfileTextField
            label="Email"
            placeholder="something@mail.com"
            value={user?.email}
            onChange={() => undefined}
            maxLength={50}
            readOnly
          />
          <ProfileTextField
            label="Allergies (optional)"
            placeholder="Peanut, and Soy"
            value={formData.allergies}
            onChange={(value) => setProfileField("allergies", value)}
            maxLength={300}
            required={false}
            textarea
            className={styles.profileDialogFieldFullWidth}
          />
        </div>
      </div>

      <div className={styles.profileDialogFooter}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        <DarbeButton
          buttonText={isProfileDialog ? "Edit Causes" : "Availability"}
          darbeButtonType="nextButton"
          onClick={handleSecondaryAction}
        />
      </div>
    </div>
  );
};
