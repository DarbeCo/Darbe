import { useNavigate } from "react-router-dom";

import { ROSTER_ROUTE } from "../../routes/route.constants";

import styles from "./styles/orgOverview.module.css";

export interface OrgOverviewProps {
  followersCount?: number;
  mutualFollowers?: { id: string; profilePicture?: string }[];
  mutualCount?: number;
  partnersCount?: number;
  businessSponsorsCount?: number;
  upcomingProjectsCount?: number;
  completedProjectsCount?: number;
  canViewRoster?: boolean;
}

const ArrowRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const OrgOverview = ({
  followersCount = 0,
  mutualFollowers = [],
  mutualCount,
  partnersCount = 0,
  businessSponsorsCount = 0,
  upcomingProjectsCount = 0,
  completedProjectsCount = 0,
  canViewRoster = false,
}: OrgOverviewProps) => {
  const navigate = useNavigate();
  const mutualTotal = mutualCount ?? mutualFollowers.length;
  const mutualAvatars = mutualFollowers.slice(0, 2);
  const handleRosterClick = () => {
    if (!canViewRoster) {
      return;
    }

    navigate(ROSTER_ROUTE);
  };

  return (
    <div className={styles.orgOverviewWrapper}>
      <section className={styles.orgOverviewCard}>
        <div className={styles.orgOverviewHeader}>
          <h2 className={styles.orgOverviewTitle}>Org Overview</h2>
          <button
            type="button"
            className={styles.orgOverviewHeaderButton}
            aria-label="View organization details"
          >
            <ArrowRightIcon />
          </button>
        </div>

        <div className={styles.orgOverviewRow}>
          <span className={styles.orgOverviewRowText}>
            Followers&nbsp;&nbsp;{followersCount}
          </span>
          {mutualTotal > 0 && (
            <span className={styles.orgOverviewMutual}>
              {mutualAvatars.length > 0 && (
                <span className={styles.orgOverviewMutualAvatars}>
                  {mutualAvatars.map((mutual) => (
                    <img
                      key={mutual.id}
                      src={mutual.profilePicture}
                      alt=""
                    />
                  ))}
                </span>
              )}
              {mutualTotal} mutual
            </span>
          )}
        </div>

        <div className={styles.orgOverviewRow}>
          <span className={styles.orgOverviewRowText}>
            {partnersCount} Members
          </span>
        </div>

        <div className={styles.orgOverviewRow}>
          <span className={styles.orgOverviewRowText}>
            {businessSponsorsCount} Business Sponsors
          </span>
        </div>

        <div className={styles.orgOverviewRow}>
          <span className={styles.orgOverviewRowText}>
            {upcomingProjectsCount} Upcoming Projects
          </span>
        </div>

        <div className={styles.orgOverviewRow}>
          <span className={styles.orgOverviewRowTextMuted}>
            {completedProjectsCount} Completed Projects
          </span>
        </div>
      </section>

      <button
        type="button"
        className={`${styles.orgOverviewRosterButton} ${
          !canViewRoster ? styles.orgOverviewRosterButtonDisabled : ""
        }`}
        onClick={handleRosterClick}
        disabled={!canViewRoster}
        aria-disabled={!canViewRoster}
        title={
          canViewRoster
            ? "View organization roster"
            : "Only organization members can view this roster"
        }
      >
        Our Roster
      </button>
    </div>
  );
};
