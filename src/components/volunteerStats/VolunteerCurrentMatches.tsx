import { IconButton } from "@mui/material";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { useNavigateHook } from "../../utils/commonHooks/UseNavigate";
import { MATCH_ROUTE } from "../../routes/route.constants";
import { VolunteerCardsProps } from "./types";
import { useAppSelector } from "../../services/hooks";
import { selectUserType } from "../../features/users/selectors";
import {
  useGetEventsQuery,
  useGetVolunteerMatchesQuery,
} from "../../services/api/endpoints/events/events.api";
import { getUserStateFromZip } from "../../utils/CommonFunctions";

import styles from "./styles/volunteerStats.module.css";

export const VolunteerCurrentMatches = ({
  simpleMode,
}: VolunteerCardsProps) => {
  const navigate = useNavigateHook();
  const userType = useAppSelector(selectUserType);
  const { data: eventMatches, isLoading: eventMatchesLoading } =
    useGetEventsQuery(undefined, {
      skip: userType !== "individual",
    });
  const { data: volunteerMatches, isLoading: volunteerMatchesLoading } =
    useGetVolunteerMatchesQuery(undefined, {
      skip: userType === "individual",
    });
  const handleClick = () => {
    navigate(MATCH_ROUTE);
  };
  const isIndividual = userType === "individual";
  const isLoading = isIndividual
    ? eventMatchesLoading
    : volunteerMatchesLoading;
  const currentMatches = isIndividual
    ? (eventMatches ?? []).slice(0, simpleMode ? 2 : 3).map((event) => {
        const state = getUserStateFromZip(event.eventAddress.zipCode)?.st;
        const location = [event.eventAddress.city, state]
          .filter(Boolean)
          .join(", ");

        return {
          id: event.id,
          title: event.eventName,
          subtitle: location || "Event match",
          meta: new Date(event.eventDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      })
    : (volunteerMatches ?? [])
        .slice(0, simpleMode ? 2 : 3)
        .map((match) => ({
          id: match.id,
          title:
            match.fullName ||
            match.organizationName ||
            match.nonprofitName ||
            "Volunteer match",
          subtitle:
            match.causes.slice(0, 2).map((cause) => cause.name).join(", ") ||
            "Volunteer match",
          meta: `${match.volunteerSummary?.eventsAttended ?? 0} events`,
        }));

  const content = (
    <div className={styles.currentMatchesList}>
      {isLoading ? (
        <span className={styles.currentMatchesEmpty}>Loading...</span>
      ) : currentMatches.length ? (
        currentMatches.map((match) => (
          <button
            key={match.id}
            type="button"
            className={styles.currentMatchesItem}
            onClick={handleClick}
          >
            <div className={styles.currentMatchesText}>
              <span className={styles.currentMatchesName}>{match.title}</span>
              <span className={styles.currentMatchesSubtitle}>
                {match.subtitle}
              </span>
            </div>
            <span className={styles.currentMatchesMeta}>{match.meta}</span>
          </button>
        ))
      ) : (
        <span className={styles.currentMatchesEmpty}>No current matches yet.</span>
      )}
    </div>
  );

  return (
    <>
      {simpleMode ? (
        <div className={styles.simpleVolunteerCard}>
          <span className={styles.volunteerStatsTitle}>Current Matches</span>
          <div className={styles.simpleVolunteerCardContent}>
            <div className={styles.simpleContent}>{content}</div>
          </div>
        </div>
      ) : (
        <div className={styles.volunteerStatCard}>
          <div className={styles.volunteerStatCardTitle}>
            <span className={styles.volunteerStatsTitle}>Current Matches</span>
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
