import { useMemo } from "react";

import { useGetRostersQuery } from "../../services/api/endpoints/roster/roster.api";
import { useGetUserProfileQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useAppSelector } from "../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../features/users/selectors";
import { OrganizationState } from "../../features/users/userProfiles/types";
import { RosterMember } from "../../services/api/endpoints/types/roster.api.types";
import { VolunteerCardsProps } from "./types";

import styles from "./styles/volunteerStats.module.css";

type AnalyticsEntity = {
  id: string;
  name: string;
};

const getEntityName = (organization: OrganizationState) =>
  organization.parentOrganization?.organizationName ||
  organization.organizationName ||
  "Organization";

const getMemberName = (member?: RosterMember) =>
  member?.user.fullName ||
  member?.user.organizationName ||
  member?.user.nonprofitName ||
  "No data yet";

const formatHours = (hours?: number) =>
  Number(hours ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });

const EntityAnalyticsRow = ({ entity }: { entity: AnalyticsEntity }) => {
  const { data: rosters = [] } = useGetRostersQuery(entity.id, {
    skip: !entity.id,
  });
  const { topEventMember, topHoursMember } = useMemo(() => {
    const membersById = new Map<string, RosterMember>();

    rosters.forEach((roster) => {
      roster.members
        .filter((member) => member.user.userType === "individual")
        .forEach((member) => {
          const existingMember = membersById.get(member.user.id);
          const existingSummary = existingMember?.volunteerSummary;
          const memberSummary = member.volunteerSummary;

          if (!existingMember) {
            membersById.set(member.user.id, member);
            return;
          }

          membersById.set(member.user.id, {
            ...existingMember,
            volunteerSummary: {
              hoursVolunteered: Math.max(
                existingSummary?.hoursVolunteered ?? 0,
                memberSummary?.hoursVolunteered ?? 0
              ),
              volunteerValue: Math.max(
                existingSummary?.volunteerValue ?? 0,
                memberSummary?.volunteerValue ?? 0
              ),
              eventsAttended: Math.max(
                existingSummary?.eventsAttended ?? 0,
                memberSummary?.eventsAttended ?? 0
              ),
            },
          });
        });
    });

    const members = Array.from(membersById.values());

    return {
      topEventMember: members.reduce<RosterMember | undefined>(
        (topMember, member) =>
          (member.volunteerSummary?.eventsAttended ?? 0) >
          (topMember?.volunteerSummary?.eventsAttended ?? 0)
            ? member
            : topMember,
        undefined
      ),
      topHoursMember: members.reduce<RosterMember | undefined>(
        (topMember, member) =>
          (member.volunteerSummary?.hoursVolunteered ?? 0) >
          (topMember?.volunteerSummary?.hoursVolunteered ?? 0)
            ? member
            : topMember,
        undefined
      ),
    };
  }, [rosters]);

  return (
    <section className={styles.analyticsEntity}>
      <h3>{entity.name}</h3>
      <dl className={styles.analyticsLeaders}>
        <div>
          <dt>Most Events</dt>
          <dd>{getMemberName(topEventMember)}</dd>
          <small>
            {topEventMember?.volunteerSummary?.eventsAttended ?? 0} attended
          </small>
        </div>
        <div>
          <dt>Most Hours</dt>
          <dd>{getMemberName(topHoursMember)}</dd>
          <small>
            {formatHours(topHoursMember?.volunteerSummary?.hoursVolunteered)}{" "}
            hours
          </small>
        </div>
      </dl>
    </section>
  );
};

export const VolunteerAnalytics = ({ simpleMode }: VolunteerCardsProps) => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { user } = useAppSelector(selectUser);
  const { data: currentUserProfile } = useGetUserProfileQuery(
    currentUserId,
    { skip: !currentUserId }
  );
  const isEntity =
    user?.userType === "organization" || user?.userType === "nonprofit";
  const entities = useMemo<AnalyticsEntity[]>(() => {
    if (isEntity && currentUserId) {
      return [
        {
          id: currentUserId,
          name:
            user?.organizationName ||
            user?.nonprofitName ||
            user?.fullName ||
            "Analytics",
        },
      ];
    }

    const activeMemberships = currentUserProfile?.organizations ?? [];
    const uniqueEntities = new Map<string, AnalyticsEntity>();

    activeMemberships
      .filter((organization) => !organization.endDate)
      .forEach((organization) => {
        const entityId = organization.parentOrganization?.id;

        if (!entityId || uniqueEntities.has(entityId)) return;

        uniqueEntities.set(entityId, {
          id: entityId,
          name: getEntityName(organization),
        });
      });

    return Array.from(uniqueEntities.values());
  }, [currentUserId, currentUserProfile?.organizations, isEntity, user]);
  const visibleEntities = simpleMode ? entities.slice(0, 1) : entities;

  return (
    <div
      className={
        simpleMode ? styles.simpleVolunteerCard : styles.volunteerStatCard
      }
    >
      <div className={styles.volunteerStatCardTitle}>
        <span className={styles.volunteerStatsTitle}>Analytics</span>
      </div>
      <div className={styles.analyticsList}>
        {visibleEntities.length ? (
          visibleEntities.map((entity) => (
            <EntityAnalyticsRow key={entity.id} entity={entity} />
          ))
        ) : (
          <span className={styles.currentMatchesEmpty}>
            No organization analytics yet.
          </span>
        )}
      </div>
    </div>
  );
};
