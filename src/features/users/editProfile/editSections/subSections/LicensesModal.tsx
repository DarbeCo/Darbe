import { useState } from "react";
import { ClosingIcon } from "../../../../../components/closingIcon/ClosingIcon";
import { Inputs } from "../../../../../components/inputs/Inputs";
import { CheckBox } from "../../../../../components/checkbox/Checkbox";
import { Dropdown } from "../../../../../components/dropdowns/Dropdown";
import { Months } from "../../../../../components/dropdowns/dropdownTypes/Months";
import { Years } from "../../../../../components/dropdowns/dropdownTypes/Years";
import { DarbeButton } from "../../../../../components/buttons/DarbeButton";
import { useEditLicenseInformation } from "../../hooks";
import { LicenseState } from "../../../userProfiles/types";
import { UseDateParser } from "../../../../../utils/commonHooks/UseDateParser";
import { prepareLicenseDates } from "../../util";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { updateUserLicenses } from "../../../userSlice";
import { useAppDispatch } from "../../../../../services/hooks";

import styles from "./styles/subSections.module.css";

interface LicensesProps {
  closeModal: () => void;
  userId: string | undefined;
  licenseId?: string;
}

export const LicensesModal = ({
  closeModal,
  userId,
  licenseId,
}: LicensesProps) => {
  const dispatch = useAppDispatch();
  const { editLicenseState } = useEditLicenseInformation(licenseId);

  const [licenseInfo, setLicenseInfo] =
    useState<LicenseState>(editLicenseState);

  const { month: issueMonth, year: issueYear } = UseDateParser(
    licenseInfo.issueDate
  );

  const { month: expirationMonth, year: expirationYear } = UseDateParser(
    licenseInfo.expirationDate
  );

  const [licenseDates, setLicenseDates] = useState({
    issueMonth: issueMonth,
    issueYear: issueYear,
    expirationMonth: expirationMonth,
    expirationYear: expirationYear,
  });

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseInfo({
      ...licenseInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseInfo({
      ...licenseInfo,
      doesNotExpire: e.target.checked,
    });
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLicenseDates({
      ...licenseDates,
      [e.target.name]: e.target.value,
    });
  };

  const prepareSumission = () => {
    const { issueDate, expirationDate } = prepareLicenseDates(licenseDates);

    setLicenseInfo({
      ...licenseInfo,
      issueDate,
      expirationDate,
    });
  };

  const handleSaveLicense = async () => {
    prepareSumission();

    const payload = {
      licenses: [licenseInfo],
      user: { id: userId },
    };

    const updatedUser = await updateUserProfile(payload).unwrap();

    if (updatedUser.licenses) {
      dispatch(updateUserLicenses(updatedUser.licenses));
    }

    closeModal();
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <div className={styles.modalContentHeader}>
          <ClosingIcon onClick={closeModal} horizontalPlacement="right" />
          <span className={styles.modalHeaderText}>Add Licenses</span>
        </div>
        <div className={styles.modalContentForm}>
          <Inputs
            label="License Name"
            placeholder="Enter license name"
            type="text"
            name="licenseName"
            darbeInputType="standardInput"
            value={licenseInfo.licenseName}
            handleChange={handleChange}
          />
          <Inputs
            label="License Issuer"
            placeholder="Enter license issuer"
            type="text"
            name="licenseIssuer"
            darbeInputType="standardInput"
            value={licenseInfo.licenseIssuer}
            handleChange={handleChange}
          />
          <div className={styles.modalContentFormDates}>
            <div className={styles.modalContentDropdowns}>
              <Dropdown
                name="issueMonth"
                label="Issue Month"
                initialValue={licenseDates.issueMonth}
                onChange={handleDropdownChange}
              >
                {Months()}
              </Dropdown>
              <Dropdown
                name="issueYear"
                label="Issue Year"
                initialValue={licenseDates.issueYear}
                onChange={handleDropdownChange}
              >
                {Years()}
              </Dropdown>
            </div>
            <div className={styles.modalContentDropdowns}>
              <Dropdown
                name="expirationMonth"
                label="Expiration Month"
                initialValue={licenseDates.expirationMonth}
                onChange={handleDropdownChange}
              >
                {Months()}
              </Dropdown>
              <Dropdown
                name="expirationYear"
                label="Expiration Year"
                initialValue={licenseDates.expirationYear}
                onChange={handleDropdownChange}
              >
                {Years()}
              </Dropdown>
            </div>
          </div>
          <CheckBox
            name="doesNotExpire"
            label="This credential does not expire"
            labelPlacement="right"
            defaultChecked={licenseInfo.doesNotExpire}
            onChange={handleCheckboxChange}
          />
        </div>
        <DarbeButton
          buttonText="Save"
          isDisabled={!licenseInfo.licenseName}
          darbeButtonType="saveButton"
          onClick={handleSaveLicense}
        />
      </div>
    </div>
  );
};
