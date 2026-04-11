import { useState } from "react";

import { ClosingIcon } from "../../../../../components/closingIcon/ClosingIcon";
import { Inputs } from "../../../../../components/inputs/Inputs";
import { Dropdown } from "../../../../../components/dropdowns/Dropdown";
import { Months } from "../../../../../components/dropdowns/dropdownTypes/Months";
import { Years } from "../../../../../components/dropdowns/dropdownTypes/Years";
import { DarbeButton } from "../../../../../components/buttons/DarbeButton";
import { useEditOrganizationInformation } from "../../hooks";
import { OrganizationState } from "../../../userProfiles/types";
import { UseDateParser } from "../../../../../utils/commonHooks/UseDateParser";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch } from "../../../../../services/hooks";

import styles from "./styles/subSections.module.css";
import { updateUserOrganizations } from "../../../userSlice";

interface OrganizationsModalProps {
  closeModal: () => void;
  userId: string;
  organizationId?: string;
}

export const OrganizationsModal = ({
  closeModal,
  userId,
  organizationId,
}: OrganizationsModalProps) => {
  const dispatch = useAppDispatch();
  const { editOrganizationState } =
    useEditOrganizationInformation(organizationId);

  const [organizationInfo, setOrganizationInfo] = useState<OrganizationState>(
    editOrganizationState
  );

  const { month: startMonth, year: startYear } = UseDateParser(
    organizationInfo.startDate
  );

  const { month: endMonth, year: endYear } = UseDateParser(
    organizationInfo.endDate
  );

  const [organizationDates, setOrganizationDates] = useState({
    startMonth,
    startYear,
    endMonth,
    endYear,
  });

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrganizationInfo({
      ...organizationInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrganizationDates({
      ...organizationDates,
      [e.target.name]: e.target.value,
    });
  };

  // TODO: Util/generificize this
  const prepareSubmission = () => {
    const startString = `${organizationDates.startMonth} ${organizationDates.startYear}`;
    const endString = `${organizationDates.endMonth} ${organizationDates.endYear}`;

    const startDate = isNaN(Date.parse(startString))
      ? undefined
      : new Date(startString);

    let endDate;

    if (organizationDates.endMonth && organizationDates.endYear) {
      endDate = isNaN(Date.parse(endString)) ? undefined : new Date(endString);
    }

    return { startDate, endDate };
  };

  const handleSaveOrganization = async () => {
    const { startDate, endDate } = prepareSubmission();

    const formattedOrganizationInfo = {
      ...organizationInfo,
      startDate,
      endDate,
    };

    const payload = {
      organizations: [formattedOrganizationInfo],
      user: { id: userId },
    };

    const newOrganization = await updateUserProfile(payload).unwrap();

    if (newOrganization?.organizations) {
      dispatch(updateUserOrganizations(newOrganization.organizations));
    }

    closeModal();
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <div className={styles.modalContentHeader}>
          <ClosingIcon onClick={closeModal} horizontalPlacement="right" />
          <span className={styles.modalHeaderText}>Add Organizations</span>
        </div>
        <div className={styles.modalContentForm}>
          <Inputs
            label="Organization Name"
            placeholder="Enter organization name"
            type="text"
            name="organizationName"
            value={organizationInfo.organizationName}
            darbeInputType="standardInput"
            handleChange={handleChange}
          />
          <Inputs
            label="Position"
            placeholder="Enter organization position"
            type="text"
            name="position"
            value={organizationInfo.position}
            darbeInputType="standardInput"
            handleChange={handleChange}
          />
          <div className={styles.modalContentFormDates}>
            <div className={styles.modalContentDropdowns}>
              <Dropdown
                name="startMonth"
                label="Start Date"
                initialValue={startMonth}
                onChange={handleDropdownChange}
              >
                {Months()}
              </Dropdown>
              <Dropdown
                name="startYear"
                label="Start Year"
                initialValue={startYear}
                onChange={handleDropdownChange}
              >
                {Years()}
              </Dropdown>
            </div>
            <div className={styles.modalContentDropdowns}>
              <Dropdown
                name="endMonth"
                label="End Date"
                initialValue={endMonth}
                onChange={handleDropdownChange}
              >
                {Months()}
              </Dropdown>
              <Dropdown
                name="endYear"
                label="End Year"
                initialValue={endYear}
                onChange={handleDropdownChange}
              >
                {Years()}
              </Dropdown>
            </div>
          </div>
        </div>
        <DarbeButton
          buttonText="Save"
          darbeButtonType="saveButton"
          isDisabled={!organizationInfo.organizationName}
          onClick={handleSaveOrganization}
        />
      </div>
    </div>
  );
};
