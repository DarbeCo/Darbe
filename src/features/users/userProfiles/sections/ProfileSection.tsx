import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../../../services/hooks";
import {
  EducationState,
  JobExperienceState,
  MilitaryServiceState,
  VolunteerExperienceState,
} from "../types";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { EDIT_SECTIONS, PROFILE_SECTIONS } from "../constants";
import { EditProfileIcon } from "./EditProfileIcon";
import { Typography } from "../../../../components/typography/Typography";
import { EDIT_PROFILE_ROUTE } from "../../../../routes/route.constants";
import {
  setModalType,
  showModal,
} from "../../../../components/modal/modalSlice";
import {
  capitalizeFirstLetter,
  formatDateTime,
} from "../../../../utils/CommonFunctions";
import { DATE_CONSTANTS } from "../../../../utils/CommonConstants";

import styles from "../styles/userProfiles.module.css";
import entityStyles from "./entity/styles/entityDetails.module.css";

type SimpleEntityData = Partial<{
  [key: string]: string;
}>;

type SectionType =
  | "about"
  | "whyVolunteer"
  | "volunteerism"
  | "jobs"
  | "education"
  | "military"
  | "licenses"
  | "skills"
  | "values";

type ProfileDataObject = Array<
  | VolunteerExperienceState
  | JobExperienceState
  | EducationState
  | MilitaryServiceState
  | SimpleEntityData
>;

interface ProfileSectionProps {
  sectionType: SectionType;
  isEmptySection: boolean;
  text?: string;
  canEdit: boolean;
  isComplexData?: boolean;
  profileData?: ProfileDataObject;
  isEntity?: boolean;
  showMore?: boolean;
}

export const ProfileSection = ({
  sectionType,
  isEmptySection,
  text,
  canEdit,
  isComplexData,
  isEntity,
  profileData,
  showMore,
}: ProfileSectionProps) => {
  const svgPath = `/svgs/common/${sectionType}Icon.svg`;
  const sectionTittle = PROFILE_SECTIONS[sectionType];
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showFullText, setShowFullText] = useState(false);

  const sectionToEdit = () => {
    if (
      sectionType === "about" ||
      sectionType === "whyVolunteer" ||
      sectionType === "volunteerism"
    ) {
      return EDIT_SECTIONS.about;
    }
    if (sectionType === "jobs" || sectionType === "education") {
      return EDIT_SECTIONS.background;
    }
    if (sectionType === "military") {
      return EDIT_SECTIONS.military;
    }
    if (sectionType === "licenses" || sectionType === "skills") {
      return EDIT_SECTIONS.qualifications;
    }
    if (sectionType === "values") {
      return EDIT_SECTIONS.values;
    }
  };

  const handleEditProfile = () => {
    const sectionRoute = sectionToEdit();

    if (sectionRoute === EDIT_SECTIONS.about) {
      dispatch(setModalType(EDIT_SECTIONS.about));
      dispatch(showModal());
      return;
    }

    if (sectionRoute) {
      navigate(`${EDIT_PROFILE_ROUTE}?section=${sectionRoute}`);
    }
  };

  const isTextLongEnough =
    !!text &&
    (text.trim().split("\n").length > 8 || text.length > 320);

  const shouldTruncateText = showMore && !showFullText && isTextLongEnough;

  const toggleShowFullText = () => setShowFullText((current) => !current);

  // TODO: Simplify these or move them out to a new file, same for the isComplexData check
  const militarySection = ({ data }: { data: MilitaryServiceState[] }) => {
    return (
      <>
        {isEmptySection ? (
          <Typography
            variant="grayText"
            textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
          />
        ) : (
          <>
            {data.map((military, index) => (
              <div key={index} className={styles.profileSectionData}>
                <div className={styles.profileRow}>
                  <Typography
                    variant="text"
                    textToDisplay={capitalizeFirstLetter(military.branch)}
                  />
                  <div className={styles.profileRowDates}>
                    <Typography
                      variant="greenTextSmall"
                      textToDisplay={capitalizeFirstLetter(military.status)}
                    />
                  </div>
                </div>
                <div className={styles.profileRow}>
                  <Typography
                    variant="grayText"
                    textToDisplay={military.rank}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  const jobSection = ({ data }: { data: JobExperienceState[] }) => {
    return (
      <>
        {isEmptySection ? (
          <Typography
            variant="grayText"
            textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
          />
        ) : (
          <>
            {data.map((job, index) => {
              const formattedStartDate = formatDateTime(
                job.startDate,
                DATE_CONSTANTS.YEAR_ONLY
              );
              const formattedEndDate = job.endDate
                ? formatDateTime(job.endDate, DATE_CONSTANTS.YEAR_ONLY)
                : "Present";

              return (
                <div key={index} className={styles.profileSectionData}>
                  <div className={styles.profileRow}>
                    <Typography
                      variant="text"
                      textToDisplay={capitalizeFirstLetter(job.entityName)}
                    />
                    <div className={styles.profileRowDates}>
                      {formattedStartDate && (
                        <>
                          <Typography
                            variant="text"
                            textToDisplay={formattedStartDate}
                          />
                          <span> - </span>
                        </>
                      )}
                      <Typography
                        variant="text"
                        textToDisplay={formattedEndDate}
                      />
                    </div>
                  </div>
                  <div className={styles.profileRow}>
                    <Typography
                      variant="grayText"
                      textToDisplay={job.jobTitle}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  const volunteerSection = ({ data }: { data: VolunteerExperienceState[] }) => {
    return (
      <>
        {isEmptySection ? (
          <Typography
            variant="grayText"
            textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
          />
        ) : (
          <>
            {data.map((volunteer, index) => {
              const formattedStartDate = formatDateTime(
                volunteer.startDate,
                DATE_CONSTANTS.YEAR_ONLY
              );
              const formattedEndDate = volunteer.endDate
                ? formatDateTime(volunteer.endDate, DATE_CONSTANTS.YEAR_ONLY)
                : "Present";
              const volunteerHours = `${volunteer.totalHours} Hours`;

              return (
                <div key={index} className={styles.profileSectionData}>
                  <div className={styles.profileRow}>
                    <Typography
                      variant="text"
                      textToDisplay={capitalizeFirstLetter(
                        volunteer.entityName
                      )}
                    />
                    <div className={styles.profileRowDates}>
                      {formattedStartDate && (
                        <>
                          <Typography
                            variant="text"
                            textToDisplay={formattedStartDate}
                          />
                          <span> - </span>
                        </>
                      )}
                      <Typography
                        variant="text"
                        textToDisplay={formattedEndDate}
                      />
                    </div>
                  </div>
                  <div className={styles.profileRow}>
                    <Typography
                      variant="grayText"
                      textToDisplay={volunteerHours}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  const educationSection = ({ data }: { data: EducationState[] }) => {
    return (
      <>
        {isEmptySection ? (
          <Typography
            variant="grayText"
            textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
          />
        ) : (
          <>
            {data.map((education, index) => {
              const formattedStartDate = formatDateTime(
                education.startDate,
                DATE_CONSTANTS.YEAR_ONLY
              );
              const formattedEndDate = education.endDate
                ? formatDateTime(education.endDate, DATE_CONSTANTS.YEAR_ONLY)
                : "Present";

              return (
                <div key={index} className={styles.profileSectionData}>
                  <div className={styles.profileRow}>
                    <Typography
                      variant="text"
                      textToDisplay={education.schoolName}
                    />
                    <div className={styles.profileRowDates}>
                      {formattedStartDate && (
                        <>
                          <Typography
                            variant="grayText"
                            textToDisplay={formattedStartDate}
                          />
                          <span> - </span>
                        </>
                      )}
                      <Typography
                        variant="grayText"
                        textToDisplay={formattedEndDate}
                      />
                    </div>
                  </div>
                  <div className={styles.profileRow}>
                    <Typography
                      variant="grayText"
                      textToDisplay={education.degree}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  const valuesSection = ({ data }: { data: SimpleEntityData[] }) => {
    return (
      <>
        {isEmptySection ? (
          <Typography
            variant="grayText"
            textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
          />
        ) : (
          <>
            {data.map((value, index) => {
              return (
                <div key={index}>
                  <div className={entityStyles.entitySubsection}>
                    <div className={entityStyles.entitySubsectionHeader}>
                      Motto
                    </div>
                    <div className={entityStyles.entitySubsectionBody}>
                      {value.motto}
                    </div>
                  </div>
                  <div className={entityStyles.entitySubsection}>
                    <div className={entityStyles.entitySubsectionHeader}>
                      Mission
                    </div>
                    <div className={entityStyles.entitySubsectionBody}>
                      {value.mission}
                    </div>
                  </div>
                  <div className={entityStyles.entitySubsection}>
                    <div className={entityStyles.entitySubsectionHeader}>
                      Value
                    </div>
                    <div className={entityStyles.entitySubsectionBody}>
                      {value.values}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  return (
    <div className={styles.profileSectionEntity}>
      {!isEntity && (
        <div className={styles.profileSectionHeader}>
          <div className={styles.profileSectionHeaderContents}>
            <CustomSvgs
              svgPath={svgPath}
              altText={`${sectionType} icon`}
              extraClass="paddingLeft"
              variant="small"
            />
            <Typography variant="sectionTitle" textToDisplay={sectionTittle} />
          </div>
          {canEdit && <EditProfileIcon onClick={handleEditProfile} />}
        </div>
      )}
      {isComplexData ? (
        <div className={styles.formattedProfileSection}>
          {sectionType === "military" &&
            profileData &&
            militarySection({ data: profileData as MilitaryServiceState[] })}
          {sectionType === "jobs" &&
            profileData &&
            jobSection({ data: profileData as JobExperienceState[] })}
          {sectionType === "volunteerism" &&
            profileData &&
            volunteerSection({
              data: profileData as VolunteerExperienceState[],
            })}
          {sectionType === "education" &&
            profileData &&
            educationSection({ data: profileData as EducationState[] })}
          {sectionType === "values" &&
            profileData &&
            valuesSection({ data: profileData as SimpleEntityData[] })}
        </div>
      ) : (
        <div className={styles.profileSectionTextContainer}>
          <div
            className={
              shouldTruncateText
                ? `${styles.profileSectionText} ${styles.truncateLines}`
                : styles.profileSectionText
            }
            style={showFullText ? { display: "block" } : undefined}
          >
            {isEmptySection ? (
              <Typography
                variant="grayText"
                textToDisplay="Greetings! This section will be containing some fun information about this user. Thank you for your patience."
              />
            ) : (
              <Typography variant="text" textToDisplay={text} />
            )}
          </div>
          {showMore && !isEmptySection && text && text.trim().length > 0 && (
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={toggleShowFullText}
              aria-expanded={showFullText}
            >
              {showFullText ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
