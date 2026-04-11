import { UserAvatars } from "../../components/avatars/UserAvatars";
import { Typography } from "../../components/typography/Typography";
import { VolunteerMatch } from "../../services/api/endpoints/types/events.api.types";

import styles from "./styles/volunteerMathces.module.css";

export const VolunteerCard = ({ match }: { match: VolunteerMatch }) => {
  const formattedDate = new Date(match.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  const hasEmergencyContact =
    match.emergencyContact && Object.keys(match.emergencyContact).length > 0;
  const causeNames = match.causes?.map((cause: any) => cause?.name ?? cause).join(", ");
  return (
    <div className={styles.volunteerCard}>
      <UserAvatars
        userId={match.id}
        profilePicture={match.profilePicture}
        fullName={match.fullName}
      />
      <Typography
        variant="sectionTitle"
        textToDisplay={`Member since ${formattedDate}`}
        extraClass="paddingLeft"
      />
      <div className={styles.volunteerImpactCard}>
        <Typography variant="sectionTitle" textToDisplay="Volunteer Summary" />
        <div className={styles.volunteerImpactDetail}>
          <Typography
            variant="boldTextSmall"
            textToDisplay={match.volunteerSummary?.hoursVolunteered ?? 0}
          />
          <Typography variant="text" textToDisplay="Hours Volunteered" />
        </div>
        <div className={styles.volunteerImpactDetail}>
          <Typography
            variant="boldTextSmall"
            textToDisplay={match.volunteerSummary?.volunteerValue ?? 0}
          />
          <Typography variant="text" textToDisplay="Volunteer Value" />
        </div>
        <div className={styles.volunteerImpactDetail}>
          <Typography
            variant="boldTextSmall"
            textToDisplay={match.volunteerSummary?.eventsAttended ?? 0}
          />
          <Typography variant="text" textToDisplay="Events Attended" />
        </div>
        <div className={styles.volunteerCauses}>
          <Typography
            variant="sectionTitle"
            textToDisplay="Interested Causes"
          />
          <Typography
            variant="text"
            textToDisplay={causeNames ?? ""}
          />
        </div>
      </div>
      <div className={styles.volunteerContact}>
        <Typography variant="sectionTitle" textToDisplay="Emergency Contact" />
        {hasEmergencyContact ? (
          <>
            <Typography
              variant="text"
              textToDisplay={`${match?.emergencyContact?.name}-${match?.emergencyContact?.relation}-${match?.emergencyContact?.phone}`}
            />
          </>
        ) : (
          <Typography
            variant="text"
            textToDisplay="No emergency contact information available"
          />
        )}
      </div>
    </div>
  );
};
