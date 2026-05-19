import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Add,
  ChevronRight,
  KeyboardArrowDown,
} from "@mui/icons-material";

import { useGetEntityEventCountsQuery } from "../../services/api/endpoints/events/events.api";
import { useGetDonorsAndStaffQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useGetRostersQuery } from "../../services/api/endpoints/roster/roster.api";
import { useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../users/selectors";

import styles from "./styles/roster.module.css";

export const RosterRightPanel = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRosterMenuOpen, setIsRosterMenuOpen] = useState(false);
  const rosterMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedRosterId = searchParams.get("rosterId");
  const { data: rosters } = useGetRostersQuery();
  const { data: eventCounts } = useGetEntityEventCountsQuery(currentUserId, {
    skip: !currentUserId,
  });
  const { data: donorsAndStaff } = useGetDonorsAndStaffQuery(
    { userId: currentUserId },
    { skip: !currentUserId }
  );

  useEffect(() => {
    if (!rosters?.length) return;

    const selectedRosterExists = rosters.some(
      (roster) => roster.id === selectedRosterId
    );

    if (!selectedRosterId || !selectedRosterExists) {
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set("rosterId", rosters[0].id);
        return nextParams;
      }, { replace: true });
    }
  }, [rosters, selectedRosterId, setSearchParams]);

  useEffect(() => {
    if (!isRosterMenuOpen) return;

    const handleClickAway = (event: MouseEvent) => {
      if (
        rosterMenuRef.current &&
        !rosterMenuRef.current.contains(event.target as Node)
      ) {
        setIsRosterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);

    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [isRosterMenuOpen]);

  const currentRoster =
    rosters?.find((roster) => roster.id === selectedRosterId) ?? rosters?.[0];
  const rosterMembers = currentRoster?.members ?? [];
  const hasMultipleRosters = (rosters?.length ?? 0) > 1;

  const handleSelectRoster = (rosterId: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("rosterId", rosterId);
      return nextParams;
    });
    setIsRosterMenuOpen(false);
  };

  const handleCreateRoster = () => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("view", "createRoster");
      if (currentRoster?.id) {
        nextParams.set("rosterId", currentRoster.id);
      }
      return nextParams;
    });
  };

  const handlePendingRequests = () => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("view", "pendingRequests");
      if (currentRoster?.id) {
        nextParams.set("rosterId", currentRoster.id);
      }
      return nextParams;
    });
  };

  return (
    <aside className={styles.rosterRightRail}>
      <section className={styles.rosterRailCard}>
        <h2>{currentRoster?.rosterName ?? "Default"}</h2>
        <span>Member Roster</span>
      </section>

      <section className={styles.rosterRailCard} ref={rosterMenuRef}>
        <div className={styles.rosterRailSelect}>
          <button
            type="button"
            className={styles.rosterRailSelectButton}
            onClick={() =>
              hasMultipleRosters &&
              setIsRosterMenuOpen((currentValue) => !currentValue)
            }
            disabled={!hasMultipleRosters}
            aria-expanded={isRosterMenuOpen}
            aria-haspopup="listbox"
          >
            <span>Select Roster</span>
            <span className={styles.rosterRailSelectIcon} aria-hidden="true">
              <KeyboardArrowDown fontSize="small" />
            </span>
          </button>

          {isRosterMenuOpen && (
            <div className={styles.rosterRailRosterMenu} role="listbox">
              {rosters?.map((roster) => (
                <button
                  type="button"
                  key={roster.id}
                  role="option"
                  aria-selected={roster.id === currentRoster?.id}
                  onClick={() => handleSelectRoster(roster.id)}
                >
                  {roster.rosterName}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        className={styles.rosterRailAction}
        onClick={handleCreateRoster}
      >
        <span>Create Roster</span>
        <span className={styles.rosterRailActionIcon} aria-hidden="true">
          <Add fontSize="small" />
        </span>
      </button>

      <button
        type="button"
        className={styles.rosterRailAction}
        onClick={handlePendingRequests}
      >
        <span>Pending Requests</span>
        <span className={styles.rosterRailActionIcon} aria-hidden="true">
          <ChevronRight fontSize="small" />
        </span>
      </button>

      <section className={styles.rosterRailOverview}>
        <h2>Org Overview</h2>
        <dl>
          <div>
            <dt>{rosterMembers.length}</dt>
            <dd>Members</dd>
          </div>
          <div>
            <dt>{donorsAndStaff?.staff.length ?? 0}</dt>
            <dd>Non-Profit Partners</dd>
          </div>
          <div>
            <dt>{donorsAndStaff?.donors.length ?? 0}</dt>
            <dd>Business Sponsors</dd>
          </div>
          <div>
            <dt>{rosterMembers.length}</dt>
            <dd>Active Volunteers</dd>
          </div>
          <div>
            <dt>{eventCounts?.completedProjectsCount ?? 0}</dt>
            <dd>Completed Projects</dd>
          </div>
          <div>
            <dt>{eventCounts?.upcomingProjectsCount ?? 0}</dt>
            <dd>Upcoming Projects</dd>
          </div>
        </dl>
      </section>

    </aside>
  );
};
