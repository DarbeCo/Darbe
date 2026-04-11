import { useState } from "react";

import { Typography } from "../../../../../components/typography/Typography";
import { Tabs } from "../../../../../components/tabs/Tabs";
import { EntityProfileState } from "../../../userSlice";
import { EDIT_SECTIONS } from "../../constants";
import { EditProfileIcon } from "../EditProfileIcon";
import { ProfileSection } from "../ProfileSection";
import { useAppDispatch } from "../../../../../services/hooks";
import {
  setModalType,
  showModal,
} from "../../../../../components/modal/modalSlice";

import styles from "./styles/entityDetails.module.css";

interface UserEntityProfileInformationProps {
  entityInformation?: Partial<EntityProfileState>;
  canEdit: boolean;
}

export const UserEntityProfileInformation = ({
  entityInformation,
  canEdit,
}: UserEntityProfileInformationProps) => {
  const [activeTab, setTabState] = useState("aboutUs");
  const isEmptyValues =
    !entityInformation?.motto ||
    !entityInformation?.mission ||
    !entityInformation?.values;
  const isEmptyAboutUs = !entityInformation?.aboutUs;
  const isEmptyPrograms = !entityInformation?.programs;

  const emptyValuesTab = activeTab === "values" && isEmptyValues;
  const emptyAboutUsTab = activeTab === "aboutUs" && isEmptyAboutUs;
  const emptyProgramsTab = activeTab === "programs" && isEmptyPrograms;

  const dispatch = useAppDispatch();
  const handleEditEntityProfile = () => {
    dispatch(setModalType(EDIT_SECTIONS.entityAbout));
    dispatch(showModal());
  };

  const tabs = ["aboutUs", "values", "programs"];

  const handleTabChange = (tab: string) => {
    setTabState(tab);
  };

  const valuesProfileInformation = {
    motto: entityInformation?.motto,
    mission: entityInformation?.mission,
    values: entityInformation?.values,
  };

  const renderActiveTab = (tab: string) => {
    switch (tab) {
      case "values":
        return (
          <ProfileSection
            sectionType="values"
            profileData={[valuesProfileInformation]}
            isComplexData
            canEdit={canEdit}
            isEntity
            isEmptySection={emptyValuesTab}
          />
        );
      case "aboutUs":
        return (
          <ProfileSection
            sectionType="about"
            text={entityInformation?.aboutUs}
            canEdit={canEdit}
            isEntity
            isEmptySection={emptyAboutUsTab}
          />
        );
      case "programs":
        return (
          <ProfileSection
            sectionType="about"
            text={entityInformation?.programs}
            canEdit={canEdit}
            isEntity
            isEmptySection={emptyProgramsTab}
          />
        );
      default:
        return (
          <div className={styles.blockTextSection}>
            <Typography
              variant="grayText"
              textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
            />
          </div>
        );
    }
  };

  return (
    <div className={styles.profileInformation}>
      <div className={styles.emptyProfile}>
        <div className={styles.emptyProfileHeader}>
          <Typography
            variant="sectionTitle"
            textToDisplay="About"
            extraClass="paddingLeft"
          />
          {canEdit && <EditProfileIcon onClick={handleEditEntityProfile} />}
        </div>
        <Tabs tabs={tabs} onChange={handleTabChange} activeTab={activeTab} />
      </div>
      {emptyValuesTab || emptyAboutUsTab || emptyProgramsTab ? (
        <div className={styles.blockTextSection}>
          <Typography
            variant="grayText"
            textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
          />
        </div>
      ) : (
        renderActiveTab(activeTab)
      )}
    </div>
  );
};
