import { IconButton } from "@mui/material";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { useNavigateHook } from "../../utils/commonHooks/UseNavigate";
import { MATCH_ROUTE } from "../../routes/route.constants";
import { VolunteerCardsProps } from "./types";

import styles from "./styles/volunteerStats.module.css";

export const VolunteerCurrentMatches = ({
  simpleMode,
}: VolunteerCardsProps) => {
  const navigate = useNavigateHook();
  const handleClick = () => {
    navigate(MATCH_ROUTE);
  };

  return (
    <>
      {simpleMode ? (
        <div className={styles.simpleVolunteerCard}>
          <span className={styles.volunteerStatsTitle}>Current Matches</span>
          <div className={styles.simpleVolunteerCardContent}>
            <div className={styles.simpleContent}>
              {/* Fill in with API .map */}
            </div>
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
          {/* Fill in with API .map */}
        </div>
      )}
    </>
  );
};
