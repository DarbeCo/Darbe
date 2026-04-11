import { useState } from "react";

import { Inputs } from "../../../../components/inputs/Inputs";
import { Dropdown } from "../../../../components/dropdowns/Dropdown";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { useUpdateEntityProfileMutation } from "../../../../services/api/endpoints/profiles/profiles.api";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { useEditEntityProfileInformation } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../selectors";
import { NonprofitTypes } from "../../../../components/dropdowns/dropdownTypes/NonprofitTypes";

import styles from "../styles/profileEdit.module.css";
import { hideModal } from "../../../../components/modal/modalSlice";

export const EditEntityProfileInfo = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = useAppSelector(selectCurrentUserId);
  const entityType = user.user?.userType;
  const { editEntityProfileState } = useEditEntityProfileInformation();

  const [editProfileInfo, setEditProfileInfo] = useState(
    editEntityProfileState
  );

  const [updateUserProfile] = useUpdateEntityProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      ...editProfileInfo,
      user: { id: userId },
    };

    await updateUserProfile(payload);

    dispatch(hideModal());
  };

  const capitalizedEntityName = splitStringndCapitalize(entityType, true);
  const formNameIdentifier =
    entityType === "nonprofit" ? "nonprofitName" : "organizationName";

  return (
    <div className={styles.profileEditContent}>
      <div className={styles.editInputs}>
        <Inputs
          label={`${capitalizedEntityName} Name`}
          placeholder={`Update your ${capitalizedEntityName} name`}
          name={formNameIdentifier}
          handleChange={handleChange}
          value={editProfileInfo[formNameIdentifier]}
          darbeInputType="standardInput"
        />
        <Inputs
          label={`Parent ${capitalizedEntityName}`}
          placeholder={`Update your parent ${capitalizedEntityName}`}
          name="parentEntity"
          handleChange={handleChange}
          value={editProfileInfo.parentEntity?.fullName}
          darbeInputType="standardInput"
        />
        {entityType === "nonprofit" && (
          <div className={styles.editProfileDropdownAreaFullWidthSingular}>
            <Dropdown
              label="Nonprofit Type"
              name="nonprofitType"
              initialValue={editProfileInfo.nonprofitType}
              onChange={handleDropdownChange}
            >
              {NonprofitTypes()}
            </Dropdown>
          </div>
        )}
        {/* I don't think design ever thought about this */}
        {/* {entityType === "organization" && (
          <div className={styles.editProfileDropdownAreaFullWidthSingular}>
            <Dropdown
              label={`associated nonprofit/organization type`}
              name="associatedEntity"
              initialValue={editProfileInfo.associatedEntity?.fullName}
              onChange={handleDropdownChange}
            >
              <> </>
            </Dropdown>
          </div>
        )} */}
        <Inputs
          label="Tagline"
          placeholder="Update your tagline"
          name="tagLine"
          handleChange={handleChange}
          value={editProfileInfo.tagLine}
          darbeInputType="standardInput"
        />
        <Inputs
          label="EIN"
          placeholder="Update your EIN"
          name="ein"
          handleChange={handleChange}
          value={editProfileInfo.ein}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Address"
          placeholder="Update your address"
          name="address"
          handleChange={handleChange}
          value={editProfileInfo.address}
          darbeInputType="standardInput"
        />
        <Inputs
          label="State"
          placeholder="Update your state"
          name="state"
          value={editProfileInfo.state}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="City"
          placeholder="Update your city"
          name="city"
          value={editProfileInfo.city}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Zip"
          placeholder="Update your zip"
          name="zip"
          value={editProfileInfo.zip}
          handleChange={handleChange}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Phone Number"
          placeholder="Update your phone number"
          name="phoneNumber"
          handleChange={handleChange}
          value={editProfileInfo.phoneNumber}
          darbeInputType="standardInput"
        />
        <Inputs
          label="Website"
          placeholder="Update your website"
          name="website"
          handleChange={handleChange}
          value={editProfileInfo.website}
          darbeInputType="standardInput"
        />
      </div>

      <div className={styles.editProfileButtons}>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          onClick={handleSave}
        />
      </div>
    </div>
  );
};
