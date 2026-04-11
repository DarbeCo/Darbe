import { useNavigate } from "react-router-dom";

import { DarbeProfileSharedState } from "../../userSlice";
import { ProfileSection } from "./ProfileSection";
import { Typography } from "../../../../components/typography/Typography";
import { EditProfileIcon } from "./EditProfileIcon";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";
import { EDIT_SECTIONS } from "../constants";
import Expander from "../../../../components/expander/Expander";

import styles from "../styles/userProfiles.module.css";

interface UserProfileInformationProps {
  userInformation?: DarbeProfileSharedState;
  canEdit: boolean;
}

export const UserProfileInformation = ({
  userInformation,
  canEdit,
}: UserProfileInformationProps) => {
  const navigate = useNavigate();
  const {
    aboutMe,
    volunteerReason,
    volunteerExperiences,
    jobExperiences,
    education,
    militaryService,
    licenses,
    skills,
  } = userInformation ?? {};

  const isEmptyProfile =
    !aboutMe &&
    !volunteerReason &&
    !volunteerExperiences?.length &&
    !jobExperiences?.length &&
    !education?.length &&
    !militaryService?.length &&
    !licenses?.length &&
    !skills?.length;

  const licensesText = licenses
    ?.map((license) => license.licenseName)
    .join(", ");

  const skillsText = skills?.map((skill) => skill.skillName).join(", ");

  const handleEditProfile = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.about}`);
  };

  return (
    <div className={styles.profileInformation}>
      {isEmptyProfile ? (
        <div className={styles.emptyProfile}>
          <div className={styles.emptyProfileHeader}>
            <Typography
              variant="sectionTitle"
              textToDisplay="About"
              extraClass="paddingLeft"
            />
            {canEdit && <EditProfileIcon onClick={handleEditProfile} />}
          </div>
          <div className={styles.blockTextSection}>
            <Typography
              variant="grayText"
              textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
            />
          </div>
        </div>
      ) : (
        <Expander elementsToShow={1} buttonText="Show More" disabled={canEdit}>
          <ProfileSection
            sectionType="about"
            text={aboutMe}
            canEdit={canEdit}
            isEmptySection={!aboutMe}
          />
          <ProfileSection
            sectionType="whyVolunteer"
            text={volunteerReason}
            canEdit={canEdit}
            isEmptySection={!volunteerReason}
          />
          <ProfileSection
            sectionType="volunteerism"
            profileData={volunteerExperiences}
            canEdit={canEdit}
            isComplexData
            isEmptySection={!volunteerExperiences?.length}
          />
          <ProfileSection
            sectionType="jobs"
            profileData={jobExperiences}
            canEdit={canEdit}
            isComplexData
            isEmptySection={!jobExperiences?.length}
          />
          <ProfileSection
            sectionType="education"
            profileData={education}
            canEdit={canEdit}
            isComplexData
            isEmptySection={!education?.length}
          />
          <ProfileSection
            sectionType="military"
            profileData={militaryService}
            canEdit={canEdit}
            isComplexData
            isEmptySection={!militaryService?.length}
          />
          <ProfileSection
            sectionType="skills"
            text={skillsText}
            canEdit={canEdit}
            isEmptySection={!skills?.length}
          />
          <ProfileSection
            sectionType="licenses"
            text={licensesText}
            canEdit={canEdit}
            isEmptySection={!licenses?.length}
          />
        </Expander>
      )}
    </div>
  );
};
