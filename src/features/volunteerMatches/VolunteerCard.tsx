import { useNavigate } from "react-router-dom";

import { assetUrl } from "../../utils/assetUrl";
import { VolunteerMatch } from "../../services/api/endpoints/types/events.api.types";
import { formatPhoneNumber } from "../../utils/formUtils/formUtils";
import { PROFILE_ROUTE } from "../../routes/route.constants";

import styles from "./styles/volunteerMathces.module.css";

interface VolunteerCardProps {
  match: VolunteerMatch;
}

const formatMemberSince = (createdAt: string) =>
  new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

const formatCurrency = (value?: number) =>
  `$${Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value?: number) =>
  Number(value ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

const getCauseName = (cause: VolunteerMatch["causes"][number]) =>
  typeof cause === "string" ? cause : cause.name;

const getCauseImage = (cause: VolunteerMatch["causes"][number]) =>
  typeof cause === "string" ? undefined : cause.imageUrl;

export const VolunteerCard = ({ match }: VolunteerCardProps) => {
  const navigate = useNavigate();
  const visibleCauses = match.causes?.slice(0, 3) ?? [];
  const extraCauseCount = Math.max((match.causes?.length ?? 0) - 3, 0);
  const memberSince = formatMemberSince(match.createdAt);
  const emergencyContact = match.emergencyContact;
  const emergencyContactPhone = formatPhoneNumber(emergencyContact?.phone);
  const handleProfileClick = () => {
    navigate(`${PROFILE_ROUTE}/${match.id}`);
  };

  return (
      <article className={styles.volunteerCard}>
        <div className={styles.volunteerProfileRow}>
          <button
            type="button"
            className={styles.volunteerAvatarButton}
            onClick={handleProfileClick}
            aria-label={`View ${match.fullName || "volunteer"} profile`}
          >
            <img
              src={match.profilePicture || assetUrl("/images/defaultProfilePicture.jpg")}
              alt=""
              className={styles.volunteerAvatar}
            />
          </button>
          <div className={styles.volunteerProfileText}>
            <button type="button" onClick={handleProfileClick}>
              {match.fullName}
            </button>
            {match.jobTitle && <span>{match.jobTitle}</span>}
          </div>
        </div>

        <p className={styles.volunteerMemberSince}>
          Member since {memberSince}: {formatNumber(match.volunteerSummary?.hoursVolunteered)} vol
          hours
        </p>

        <div className={styles.volunteerInfoGrid}>
          <section className={styles.volunteerImpactCard}>
            <h3>Total Volunteer Summary</h3>
            <dl>
              <div>
                <dt>{formatNumber(match.volunteerSummary?.hoursVolunteered)}</dt>
                <dd>Hours Volunteered</dd>
              </div>
              <div>
                <dt>{formatCurrency(match.volunteerSummary?.volunteerValue)}</dt>
                <dd>Volunteer Value</dd>
              </div>
              <div>
                <dt>{match.volunteerSummary?.eventsAttended ?? 0}</dt>
                <dd>Events Attended</dd>
              </div>
            </dl>
          </section>

          <section className={styles.volunteerCausesCard}>
            <h3>Interested Causes</h3>
            <ul>
              {visibleCauses.map((cause) => (
                <li key={getCauseName(cause)}>
                  <img
                    src={
                      getCauseImage(cause) ||
                      assetUrl("/images/defaultCoverPhoto.jpg")
                    }
                    alt=""
                  />
                  <span>{getCauseName(cause)}</span>
                </li>
              ))}
            </ul>
            {extraCauseCount > 0 && (
              <span className={styles.volunteerExtraCauses}>
                +{extraCauseCount} more
              </span>
            )}
          </section>
        </div>

        <div className={styles.volunteerContactGrid}>
          <div>
            <h3>Emergency Contact</h3>
            <p>{emergencyContact?.name || "None"}</p>
          </div>
          <div>
            <h3>Relationship</h3>
            <p>{emergencyContact?.relation || "None"}</p>
          </div>
          <div>
            <h3>Phone Number</h3>
            <p>{emergencyContactPhone || "None"}</p>
          </div>
        </div>
      </article>
  );
};
