import { EDIT_SECTIONS } from "../userProfiles/constants";
import { EditAbout } from "./editSections/EditAbout";
import { EditAvailability } from "./editSections/EditAvailability";
import { EditBackground } from "./editSections/EditBackground";
import { EditCauses } from "./editSections/EditCauses";
import { EditFriends } from "./editSections/EditFriends";
import { EditMilitary } from "./editSections/EditMilitary";
import { EditOrganizations } from "./editSections/EditOrganizations";
import { EditProfileInfo } from "./editSections/EditProfileInfo";
import { EditQualifications } from "./editSections/EditQualifications";
import { EditProfileProps } from "./editSections/types";
import { EditActivity } from "./editSections/EditActivity";

import styles from "./styles/profileEdit.module.css";

interface UserEditSectionsProps extends EditProfileProps {
  section: string;
}

export const UserEditSections = ({
  section,
  userId,
}: UserEditSectionsProps) => {
  if (!userId) {
    return null;
  }

  return (
    <div className={styles.profileEditContent}>
      {section === EDIT_SECTIONS.about && <EditAbout />}
      {section === EDIT_SECTIONS.background && (
        <EditBackground />
      )}
      {section === EDIT_SECTIONS.military && <EditMilitary />}
      {section === EDIT_SECTIONS.qualifications && (
        <EditQualifications />
      )}
      {section === EDIT_SECTIONS.causes && <EditCauses />}
      {section === EDIT_SECTIONS.availability && (
        <EditAvailability />
      )}
      {section === EDIT_SECTIONS.organizations && (
        <EditOrganizations />
      )}
      {section === EDIT_SECTIONS.profile && <EditProfileInfo />}
      {section === EDIT_SECTIONS.friends && <EditFriends />}
      {section === EDIT_SECTIONS.activity && <EditActivity />}
    </div>
  );
};
