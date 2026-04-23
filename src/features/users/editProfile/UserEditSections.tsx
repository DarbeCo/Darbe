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

  const activeSection = section || EDIT_SECTIONS.about;

  return (
    <>
      {activeSection === EDIT_SECTIONS.about && <EditAbout />}
      {activeSection === EDIT_SECTIONS.background && (
        <EditBackground />
      )}
      {activeSection === EDIT_SECTIONS.military && <EditMilitary />}
      {activeSection === EDIT_SECTIONS.qualifications && (
        <EditQualifications />
      )}
      {activeSection === EDIT_SECTIONS.causes && <EditCauses />}
      {activeSection === EDIT_SECTIONS.availability && (
        <EditAvailability />
      )}
      {activeSection === EDIT_SECTIONS.organizations && (
        <EditOrganizations />
      )}
      {activeSection === EDIT_SECTIONS.profile && <EditProfileInfo />}
      {activeSection === EDIT_SECTIONS.friends && <EditFriends />}
      {activeSection === EDIT_SECTIONS.activity && <EditActivity />}
    </>
  );
};
