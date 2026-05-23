import { DashboardCustomize } from "@mui/icons-material";
import { Drawer } from "@mui/material";
import { FriendSuggestions } from "../../../components/friendSuggestions/FriendSuggestions";
import {
  OrgOverview,
  OrgOverviewProps,
} from "../../../components/orgOverview/OrgOverview";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { VolunteerAnnualSummary } from "../../../components/volunteerStats/VolunteerAnnualSummary";
import { VolunteerCurrentMatches } from "../../../components/volunteerStats/VolunteerCurrentMatches";
import { VolunteerRecentImpacts } from "../../../components/volunteerStats/VolunteerRecentImpacts";
import { RosterRightPanel } from "../../../features/roster/RosterRightPanel";

import styles from "../styles/mainPage.module.css";

interface RightPanelProps {
  showSuggestedFriends?: boolean;
  showOrgOverview?: boolean;
  showOrgOverviewInStats?: boolean;
  showRosterPanel?: boolean;
  orgOverviewProps?: OrgOverviewProps;
}

export const RightPanel = ({
  showSuggestedFriends,
  showOrgOverview,
  showOrgOverviewInStats,
  showRosterPanel,
  orgOverviewProps,
}: RightPanelProps) => {
  if (showRosterPanel) {
    return <RosterRightPanel />;
  }

  if (showOrgOverview) {
    return <OrgOverview {...(orgOverviewProps ?? {})} />;
  }

  return (
    <>
      {showSuggestedFriends ? (
        <FriendSuggestions />
      ) : (
        <div className={styles.rightPanelStats}>
          {showOrgOverviewInStats && <OrgOverview {...(orgOverviewProps ?? {})} />}
          <VolunteerCurrentMatches />
          <VolunteerRecentImpacts />
          {!showOrgOverviewInStats && <VolunteerAnnualSummary />}
        </div>
      )}
    </>
  );
};

type MobilePanelItem = {
  id: string;
  label: string;
  content: ReactNode;
};

const useMobilePanelItems = ({
  showSuggestedFriends,
  showOrgOverview,
  showOrgOverviewInStats,
  showRosterPanel,
  orgOverviewProps,
}: RightPanelProps) =>
  useMemo<MobilePanelItem[]>(() => {
    if (showRosterPanel) {
      return [
        {
          id: "roster",
          label: "Roster",
          content: <RosterRightPanel />,
        },
      ];
    }

    if (showOrgOverview) {
      return [
        {
          id: "org",
          label: "Org View",
          content: <OrgOverview {...(orgOverviewProps ?? {})} />,
        },
      ];
    }

    if (showSuggestedFriends) {
      return [
        {
          id: "suggestions",
          label: "Suggestions",
          content: <FriendSuggestions />,
        },
      ];
    }

    return [
      ...(showOrgOverviewInStats
        ? [
            {
              id: "org",
              label: "Org View",
              content: <OrgOverview {...(orgOverviewProps ?? {})} />,
            },
          ]
        : [
            {
              id: "annual",
              label: "Annual",
              content: <VolunteerAnnualSummary />,
            },
          ]),
      {
        id: "matches",
        label: "Current Match",
        content: <VolunteerCurrentMatches />,
      },
      {
        id: "impacts",
        label: "Recent Impact",
        content: <VolunteerRecentImpacts />,
      },
    ];
  }, [
    orgOverviewProps,
    showOrgOverview,
    showOrgOverviewInStats,
    showRosterPanel,
    showSuggestedFriends,
  ]);
export const MobileRightPanelDrawer = (props: RightPanelProps) => {
  const panelItems = useMobilePanelItems(props);
  const [isOpen, setIsOpen] = useState(false);
  const [activePanelId, setActivePanelId] = useState(panelItems[0]?.id ?? "");
  const activePanel =
    panelItems.find((panelItem) => panelItem.id === activePanelId) ??
    panelItems[0];

  useEffect(() => {
    if (
      panelItems.length > 0 &&
      !panelItems.some((panelItem) => panelItem.id === activePanelId)
    ) {
      setActivePanelId(panelItems[0].id);
    }
  }, [activePanelId, panelItems]);

  if (!activePanel) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.mobileDashboardButton}
        onClick={() => setIsOpen(true)}
      >
        <DashboardCustomize fontSize="small" />
        Dashboard
      </button>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{ className: styles.mobileRightPanelDrawerPaper }}
      >
        <div className={styles.mobileRightPanelDrawer}>
          <div className={styles.mobileRightPanelDrawerHeader}>
            <h2>Dashboard</h2>
            <button type="button" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
          {panelItems.length > 1 && (
            <div className={styles.mobileRightPanelMenu}>
              {panelItems.map((panelItem) => (
                <button
                  type="button"
                  key={panelItem.id}
                  className={`${styles.mobileRightPanelMenuItem} ${
                    panelItem.id === activePanel.id
                      ? styles.mobileRightPanelMenuItemActive
                      : ""
                  }`}
                  onClick={() => setActivePanelId(panelItem.id)}
                >
                  {panelItem.label}
                </button>
              ))}
            </div>
          )}
          <div className={styles.mobileRightPanelDrawerContent}>
            {activePanel.content}
          </div>
        </div>
      </Drawer>
    </>
  );
};
