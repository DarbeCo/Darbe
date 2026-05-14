import { IconButton } from "@mui/material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { useNavigateHook } from "../../utils/commonHooks/UseNavigate";
import { IMPACT_ROUTE } from "../../routes/route.constants";
import { VolunteerCardsProps } from "./types";
import { useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../../features/users/selectors";
import { useGetUserImpactQuery } from "../../services/api/endpoints/impact/impact.api";

import styles from "./styles/volunteerStats.module.css";

const getOwnerName = (impact: {
  event: {
    eventOwner: {
      organizationName?: string;
      nonprofitName?: string;
      fullName?: string;
    };
  };
}) =>
  impact.event.eventOwner.organizationName ||
  impact.event.eventOwner.nonprofitName ||
  impact.event.eventOwner.fullName ||
  "Darbe Partner";

const formatHours = (hours: number) =>
  `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;

export const VolunteerRecentImpacts = ({ simpleMode }: VolunteerCardsProps) => {
  const navigate = useNavigateHook();
  const userId = useAppSelector(selectCurrentUserId);
  const { data: userImpacts = [], isLoading } = useGetUserImpactQuery(
    userId ?? "",
    { skip: !userId }
  );
  const recentImpacts = userImpacts.slice(0, simpleMode ? 2 : 3);

  const handleClick = () => {
    navigate(IMPACT_ROUTE);
  };

  const content = (
    <div className={styles.currentMatchesList}>
      {isLoading ? (
        <span className={styles.currentMatchesEmpty}>Loading...</span>
      ) : recentImpacts.length ? (
        recentImpacts.map((impact) => (
          <button
            key={impact.id}
            type="button"
            className={styles.currentMatchesItem}
            onClick={handleClick}
          >
            <div className={styles.currentMatchesText}>
              <span className={styles.currentMatchesName}>
                {impact.event.eventName}
              </span>
              <span className={styles.currentMatchesSubtitle}>
                {getOwnerName(impact)} ·{" "}
                {new Date(impact.event.eventDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <span className={styles.currentMatchesMeta}>
              {formatHours(impact.hoursVolunteered)}
            </span>
          </button>
        ))
      ) : (
        <span className={styles.currentMatchesEmpty}>No recent impacts yet.</span>
      )}
    </div>
  );

  return (
    <>
      {simpleMode ? (
        <div className={styles.simpleVolunteerCard}>
          <span className={styles.volunteerStatsTitle}>Recent Impacts</span>
          <div className={styles.simpleVolunteerCardContent}>
            <div className={styles.simpleContent}>{content}</div>
          </div>
        </div>
      ) : (
        <div className={styles.volunteerStatCard}>
          <div className={styles.volunteerStatCardTitle}>
            <span className={styles.volunteerStatsTitle}>Recent Impacts</span>
            <IconButton onClick={handleClick}>
              <CustomSvgs
                altText="arrow right"
                svgPath="/svgs/common/goForwardIcon.svg"
              />
            </IconButton>
          </div>
          {content}
        </div>
      )}
    </>
  );
};
