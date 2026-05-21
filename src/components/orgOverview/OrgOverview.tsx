import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PROFILE_ROUTE, ROSTER_ROUTE } from "../../routes/route.constants";
import { useGetEntityUpcomingEventsQuery } from "../../services/api/endpoints/events/events.api";
import { useGetOrgJoinRequestsQuery } from "../../services/api/endpoints/friends/friends.api";
import { useGetEntityRosterMembersQuery } from "../../services/api/endpoints/roster/roster.api";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/orgOverview.module.css";

type OrgOverviewFollower = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  organizationName?: string;
  nonprofitName?: string;
};

export interface OrgOverviewProps {
  entityId?: string;
  followersCount?: number;
  followers?: OrgOverviewFollower[];
  followingCount?: number;
  following?: OrgOverviewFollower[];
  mutualFollowers?: OrgOverviewFollower[];
  mutualCount?: number;
  partnersCount?: number;
  members?: OrgOverviewFollower[];
  businessSponsorsCount?: number;
  businessSponsors?: OrgOverviewFollower[];
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
  entityId,
  followersCount = 0,
  followers = [],
  followingCount = 0,
  following = [],
  mutualFollowers = [],
  mutualCount,
  partnersCount = 0,
  members = [],
  businessSponsorsCount = 0,
  businessSponsors = [],
  upcomingProjectsCount = 0,
  completedProjectsCount = 0,
  canViewRoster = false,
}: OrgOverviewProps) => {
  const navigate = useNavigate();
  const [activeList, setActiveList] = useState<
    "followers" | "following" | "members" | "sponsors" | "projects" | null
  >(null);
  const { data: rosterMembers = [] } = useGetEntityRosterMembersQuery(
    entityId ?? "",
    {
      skip:
        !entityId || !canViewRoster || !activeList || activeList !== "members",
    }
  );
  const { data: upcomingProjects = [] } = useGetEntityUpcomingEventsQuery(
    entityId ?? "",
    { skip: !entityId || !activeList || activeList !== "projects" }
  );
  const { data: pendingRequests = [] } = useGetOrgJoinRequestsQuery(undefined, {
    skip: !canViewRoster,
  });
  const mutualTotal = mutualCount ?? mutualFollowers.length;
  const mutualAvatars = mutualFollowers.slice(0, 2);
  const getFollowerName = (follower: OrgOverviewFollower) =>
    follower.fullName ||
    follower.organizationName ||
    follower.nonprofitName ||
    `${follower.firstName ?? ""} ${follower.lastName ?? ""}`.trim() ||
    "User";
  const membersToDisplay = rosterMembers.length ? rosterMembers : members;
  const activeListTitle =
    activeList === "followers"
      ? "Followers"
      : activeList === "following"
      ? "Following"
      : activeList === "members"
      ? "Members"
      : activeList === "sponsors"
      ? "Supporters"
      : "Upcoming Projects";
  const handleRosterClick = () => {
    if (!canViewRoster) {
      return;
    }

    navigate(`${ROSTER_ROUTE}?entityId=${entityId}`);
  };

  useEffect(() => {
    if (!canViewRoster && activeList === "members") {
      setActiveList(null);
    }
  }, [activeList, canViewRoster]);

  const handlePendingRequestsClick = () => {
    if (!canViewRoster) {
      return;
    }

    navigate(`${ROSTER_ROUTE}?view=pendingRequests`);
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

        <button
          type="button"
          className={styles.orgOverviewRowButton}
          onClick={() => setActiveList("followers")}
          disabled={followersCount === 0}
        >
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
        </button>

        <button
          type="button"
          className={styles.orgOverviewRowButton}
          onClick={() => setActiveList("following")}
          disabled={followingCount === 0}
        >
          <span className={styles.orgOverviewRowText}>
            Following&nbsp;&nbsp;{followingCount}
          </span>
        </button>

        <button
          type="button"
          className={styles.orgOverviewRowButton}
          onClick={() => {
            if (canViewRoster) {
              setActiveList("members");
            }
          }}
          disabled={!canViewRoster}
          aria-disabled={!canViewRoster}
          title={
            canViewRoster
              ? "View organization members"
              : "Only organization members can view this member list"
          }
        >
          <span className={styles.orgOverviewRowText}>
            {partnersCount} Members
          </span>
        </button>

        <button
          type="button"
          className={styles.orgOverviewRowButton}
          onClick={handlePendingRequestsClick}
          disabled={!canViewRoster}
        >
          <span className={styles.orgOverviewRowText}>
            {pendingRequests.length} Pending Requests
          </span>
        </button>

        <button
          type="button"
          className={styles.orgOverviewRowButton}
          onClick={() => setActiveList("sponsors")}
        >
          <span className={styles.orgOverviewRowText}>
            {businessSponsorsCount} Supporters
          </span>
        </button>

        <button
          type="button"
          className={styles.orgOverviewRowButton}
          onClick={() => setActiveList("projects")}
          disabled={upcomingProjectsCount === 0}
        >
          <span className={styles.orgOverviewRowText}>
            {upcomingProjectsCount} Upcoming Projects
          </span>
        </button>

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

      {activeList && (
        <div className={styles.orgFollowersOverlay}>
          <div
            className={styles.orgFollowersDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-followers-title"
          >
            <div className={styles.orgFollowersHeader}>
              <h2 id="org-followers-title">{activeListTitle}</h2>
              <button
                type="button"
                onClick={() => setActiveList(null)}
                aria-label={`Close ${activeListTitle} list`}
              >
                x
              </button>
            </div>
            <div className={styles.orgFollowersList}>
              {activeList === "projects" ? (
                <>
                  {upcomingProjects.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      className={styles.orgFollowersItem}
                      onClick={() => {
                        setActiveList(null);
                        navigate(`/home/events/${project.id}`);
                      }}
                    >
                      <img
                        src={
                          project.eventCoverPhoto ||
                          assetUrl("/images/defaultCoverPhoto.jpg")
                        }
                        alt=""
                      />
                      <span>{project.eventName}</span>
                    </button>
                  ))}
                  {upcomingProjects.length === 0 && (
                    <p className={styles.orgFollowersEmpty}>
                      No upcoming projects.
                    </p>
                  )}
                </>
              ) : (
                <>
                  {(activeList === "followers"
                    ? followers
                    : activeList === "following"
                    ? following
                    : activeList === "members"
                    ? membersToDisplay
                    : businessSponsors
                  ).map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      className={styles.orgFollowersItem}
                      onClick={() => {
                        setActiveList(null);
                        navigate(`${PROFILE_ROUTE}/${person.id}`);
                      }}
                    >
                      <img
                        src={
                          person.profilePicture ||
                          assetUrl("/images/defaultProfilePicture.jpg")
                        }
                        alt=""
                      />
                      <span>{getFollowerName(person)}</span>
                    </button>
                  ))}
                  {(activeList === "followers"
                    ? followers
                    : activeList === "following"
                    ? following
                    : activeList === "members"
                    ? membersToDisplay
                    : businessSponsors
                  ).length === 0 && (
                    <p className={styles.orgFollowersEmpty}>
                      No {activeListTitle.toLowerCase()} yet.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
