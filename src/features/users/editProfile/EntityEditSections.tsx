import { EDIT_SECTIONS } from "../userProfiles/constants";
import { EditEntityAbout } from "./editEntitySections/EditEntityAbout";
import { EditEntityDocuments } from "./editEntitySections/EditEntityDocuments";
import { EditEntityProfileInfo } from "./editEntitySections/EditEntityProfileInfo";
import { EditEntityPrograms } from "./editEntitySections/EditEntityPrograms";
import { EditEntityUsers } from "./editEntitySections/EditEntityUsers";
import { EditEntityValues } from "./editEntitySections/EditEntityValues";
import { EditProfileProps } from "./editSections/types";
import { EditActivity } from "./editSections/EditActivity";

import styles from "./styles/profileEdit.module.css";

interface EntityEditSections extends EditProfileProps {
  section: string;
  entityType?: string;
}

// TODO: Figure out how to edit staff and donors? Implicit or explicit system?
export const EntityEditSections = ({
  section,
  entityType,
  userId,
}: EntityEditSections) => {
  if (!userId) {
    return null;
  }

  return (
    <div className={styles.profileEditContent}>
      {section === EDIT_SECTIONS.about && <EditEntityAbout />}
      {section === EDIT_SECTIONS.values && <EditEntityValues />}
      {section === EDIT_SECTIONS.programs && <EditEntityPrograms />}
      {section === EDIT_SECTIONS.profile && <EditEntityProfileInfo />}
      {section === EDIT_SECTIONS.donors && (
        <EditEntityUsers
          entityType={entityType}
          editType="donors"
          userId={userId}
        />
      )}
      {section === EDIT_SECTIONS.staff && (
        <EditEntityUsers
          entityType={entityType}
          editType="staff"
          userId={userId}
        />
      )}
      {section === EDIT_SECTIONS.documents && <EditEntityDocuments />}
      {section === EDIT_SECTIONS.activity && <EditActivity />}
    </div>
  );
};
