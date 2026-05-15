import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useGetEntityEventCountsQuery } from "../../services/api/endpoints/events/events.api";
import { useGetDonorsAndStaffQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useGetRostersQuery } from "../../services/api/endpoints/roster/roster.api";
import {
  setModalType,
  showModal,
} from "../../components/modal/modalSlice";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../users/selectors";
import { EDIT_SECTIONS } from "../users/userProfiles/constants";

import styles from "./styles/roster.module.css";

export const RosterRightPanel = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const currentRoster =
    rosters?.find((roster) => roster.id === selectedRosterId) ?? rosters?.[0];
  const rosterMembers = currentRoster?.members ?? [];
  const hasMultipleRosters = (rosters?.length ?? 0) > 1;

  const handleCreateRoster = () => {
    dispatch(setModalType(EDIT_SECTIONS.createRoster));
    dispatch(showModal());
  };

  return (
    <aside className={styles.rosterRightRail}>
      <section className={styles.rosterRailCard}>
        <h2>{currentRoster?.rosterName ?? "Default"}</h2>
        <span>Member Roster</span>
      </section>

      <section className={styles.rosterRailCard}>
        <label className={styles.rosterRailSelect}>
          <span>Select Roster</span>
          <select
            value={currentRoster?.id ?? ""}
            onChange={(event) => {
              setSearchParams((currentParams) => {
                const nextParams = new URLSearchParams(currentParams);
                nextParams.set("rosterId", event.target.value);
                return nextParams;
              });
            }}
            disabled={!hasMultipleRosters}
            aria-label="Select roster"
          >
            {rosters?.map((roster) => (
              <option key={roster.id} value={roster.id}>
                {roster.rosterName}
              </option>
            ))}
          </select>
        </label>
      </section>

      <button
        type="button"
        className={styles.rosterRailAction}
        onClick={handleCreateRoster}
      >
        <span>Create Roster</span>
        <strong>+</strong>
      </button>

      <button type="button" className={styles.rosterRailAction}>
        <span>Pending Requests</span>
        <strong>{">"}</strong>
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
