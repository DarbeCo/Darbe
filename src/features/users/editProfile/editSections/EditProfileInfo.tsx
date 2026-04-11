import { useState } from "react";

import { useUpdateUserProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { Inputs } from "../../../../components/inputs/Inputs";
import { Dropdown } from "../../../../components/dropdowns/Dropdown";
import { Genders } from "../../../../components/dropdowns/dropdownTypes/Genders";
import { Race } from "../../../../components/dropdowns/dropdownTypes/Race";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { EDIT_SECTIONS } from "../../userProfiles/constants";
import { useEditProfileInformation } from "../hooks";
import { DarbeProfileSharedState } from "../../userSlice";
import { States } from "../../../../components/dropdowns/dropdownTypes/States";
import {
  hideModal,
  setModalType,
  showModal,
} from "../../../../components/modal/modalSlice";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../selectors";

import styles from "../styles/profileEdit.module.css";

export const EditProfileInfo = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const user = useAppSelector(selectUser);
  const editProfileState = useEditProfileInformation();
  const [formData, setFormData] =
    useState<Partial<DarbeProfileSharedState>>(editProfileState);

  const userType = user.user?.userType;

  const [updateUserProfile] = useUpdateUserProfileMutation();
  const dispatch = useAppDispatch();
  // TODO: Messy, clean up
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (
      name === "firstName" ||
      name === "lastName" ||
      name === "zip" ||
      name === "nonprofitName" ||
      name === "organizationName" ||
      name === "ein"
    ) {
      setFormData((prev) => ({
        ...prev,
        user: { ...prev.user, [name]: value },
      }));
    } else if (
      name === "emergencyContact name" ||
      name === "emergencyContact phone"
    ) {
      const [, subKey] = name.split(" ");

      setFormData((prev) => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [subKey]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      user: {
        ...formData.user,
        id: userId,
      },
    };

    await updateUserProfile(payload);
    dispatch(hideModal());
  };
  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(editProfileState);
  };

  const handleNextSection = () => {
    if (isFormDirty()) {
      handleSave();
    }
    dispatch(setModalType(EDIT_SECTIONS.availability));
    dispatch(showModal());
  };

  // TODO: Messy, clean up into separete components
  return (
    <div className={styles.profileEditContent}>
      {userType === "individual" && (
        <div className={styles.editProfileInfoInputs}>
          <Inputs
            label="First Name"
            placeholder="Update your first name"
            value={formData.user?.firstName}
            name="firstName"
            handleChange={handleChange}
            darbeInputType="standardInput"
          />
          <Inputs
            label="Last Name"
            placeholder="Update your last name"
            value={formData.user?.lastName}
            name="lastName"
            handleChange={handleChange}
            darbeInputType="standardInput"
          />
          <Inputs
            label="City"
            placeholder="Update your city"
            name="city"
            value={formData.city}
            handleChange={handleChange}
            darbeInputType="standardInput"
          />
          <div className={styles.editProfileDropdownAreaFullWidth}>
            <Dropdown
              label="State"
              name="state"
              initialValue={formData.state}
              onChange={handleDropdownChange}
            >
              {States()}
            </Dropdown>
          </div>
          <Inputs
            label="Zip"
            placeholder="Update your zip"
            name="zip"
            value={formData.user?.zip}
            handleChange={handleChange}
            darbeInputType="standardInput"
          />
          <Inputs
            label="Tagline"
            placeholder="Update your tagline"
            name="tagLine"
            value={formData.tagLine}
            handleChange={handleChange}
            darbeInputType="standardInput"
          />
          <div className={styles.editProfileDropdownAreaFullWidth}>
            <Dropdown
              label="Gender"
              name="gender"
              initialValue={formData.gender}
              onChange={handleDropdownChange}
            >
              {Genders()}
            </Dropdown>
          </div>
          <div className={styles.editProfileDropdownAreaFullWidth}>
            <Dropdown
              label="Race"
              name="race"
              initialValue={formData.race}
              onChange={handleDropdownChange}
            >
              {Race()}
            </Dropdown>
          </div>
          <Inputs
            label="Emergency Contact Name"
            placeholder="Emergency contact name"
            name="emergencyContact name"
            handleChange={handleChange}
            value={formData.emergencyContact?.name}
            darbeInputType="standardInput"
          />
          <Inputs
            label="Emergency Contact Phone Number"
            placeholder="Emergency contact phone number"
            name="emergencyContact phone"
            handleChange={handleChange}
            value={formData.emergencyContact?.phone}
            darbeInputType="standardInput"
          />
          <Inputs
            label="Allergies"
            placeholder="Update your allergies"
            name="allergies"
            value={formData.allergies}
            handleChange={handleChange}
            darbeInputType="textAreaInput"
          />
        </div>
      )}

      <div className={styles.editProfileInfoInputsNonprofit}>
        {userType === "organization" && (
          <>
            <Inputs
              label="Organization Name"
              placeholder="Update your organization name"
              value={formData.user?.organizationName}
              name="organizationName"
              handleChange={handleChange}
              darbeInputType="standardInput"
            />
            <Inputs
              label="Parent Organization"
              placeholder="Update your parent organization"
              value={formData.user?.nonprofitName}
              name="parentOrganization"
              handleChange={handleChange}
              darbeInputType="standardInput"
            />
            <Inputs
              label="Tagline"
              placeholder="Update your tagline"
              name="tagLine"
              value={formData.tagLine}
              handleChange={handleChange}
              darbeInputType="standardInput"
            />
            <Inputs
              label="City"
              placeholder="Update your city"
              name="city"
              value={formData.city}
              handleChange={handleChange}
              darbeInputType="standardInput"
            />
            <div className={styles.twoInputsRow}>
              <div className={styles.editProfileDropdownAreaFullWidth}>
                <Dropdown
                  label="State"
                  name="state"
                  initialValue={formData.state}
                  onChange={handleDropdownChange}
                >
                  {States()}
                </Dropdown>
              </div>
              <Inputs
                label="Zip"
                placeholder="Update your zip"
                name="zip"
                value={formData.user?.zip}
                handleChange={handleChange}
                darbeInputType="standardInput"
              />
            </div>
            <Inputs
              label="EIN"
              placeholder="000-00-0000"
              name="ein"
              handleChange={handleChange}
              value={formData.user?.ein}
              darbeInputType="standardInput"
            />
          </>
        )}
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
        {userType === "individual" && (
          <DarbeButton
            buttonText="Availability"
            darbeButtonType="nextButton"
            endingIconPath="/svgs/common/goForwardIconWhite.svg"
            onClick={handleNextSection}
          />
        )}
      </div>
    </div>
  );
};
