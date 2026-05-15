import { FriendSuggestions } from "../../../components/friendSuggestions/FriendSuggestions";
import {
  OrgOverview,
  OrgOverviewProps,
} from "../../../components/orgOverview/OrgOverview";
import { VolunteerAnnualSummary } from "../../../components/volunteerStats/VolunteerAnnualSummary";
import { VolunteerCurrentMatches } from "../../../components/volunteerStats/VolunteerCurrentMatches";
import { VolunteerRecentImpacts } from "../../../components/volunteerStats/VolunteerRecentImpacts";

import styles from "../styles/mainPage.module.css";

interface RightPanelProps {
  showSuggestedFriends?: boolean;
  showOrgOverview?: boolean;
  orgOverviewProps?: OrgOverviewProps;
}

export const RightPanel = ({
  showSuggestedFriends,
  showOrgOverview,
  orgOverviewProps,
}: RightPanelProps) => {
  if (showOrgOverview) {
    return <OrgOverview {...(orgOverviewProps ?? {})} />;
  }

  return (
    <>
      {showSuggestedFriends ? (
        <FriendSuggestions />
      ) : (
        <div className={styles.rightPanelStats}>
          <VolunteerCurrentMatches />
          <VolunteerRecentImpacts />
          <VolunteerAnnualSummary />
        </div>
      )}
    </>
  );
};
