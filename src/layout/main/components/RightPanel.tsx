import { FriendSuggestions } from "../../../components/friendSuggestions/FriendSuggestions";
import { VolunteerAnnualSummary } from "../../../components/volunteerStats/VolunteerAnnualSummary";
import { VolunteerCurrentMatches } from "../../../components/volunteerStats/VolunteerCurrentMatches";
import { VolunteerRecentImpacts } from "../../../components/volunteerStats/VolunteerRecentImpacts";

import styles from "../styles/mainPage.module.css";

interface RightPanelProps {
  showSuggestedFriends?: boolean;
}

export const RightPanel = ({ showSuggestedFriends }: RightPanelProps) => {
  return (
    <>
      {showSuggestedFriends ? (
        <FriendSuggestions />
      ) : (
        <div className={styles.rightPanelStats}>
          <VolunteerRecentImpacts />
          <VolunteerCurrentMatches />
          <VolunteerAnnualSummary />
        </div>
      )}
    </>
  );
};
