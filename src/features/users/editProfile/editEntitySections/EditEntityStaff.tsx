import { useMemo, useState } from "react";
import { AddCircle } from "@mui/icons-material";
import { CircularProgress, IconButton } from "@mui/material";

import { UserAvatars } from "../../../../components/avatars/UserAvatars";
import { useGetAllRosterMembersQuery } from "../../../../services/api/endpoints/roster/roster.api";
import { useGetSearchResultsQuery } from "../../../../services/api/endpoints/search/search.api";
import {
  useAddToDonorsMutation,
  useAddToStaffMutation,
  useGetDonorsAndStaffQuery,
} from "../../../../services/api/endpoints/profiles/profiles.api";
import { LocalSearchBar } from "../../../../components/searchBar/LocalSearchBar";
import { useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId } from "../../selectors";

import styles from "../styles/profileEdit.module.css";

interface EditEntityStaffProps {
  category: "donors" | "staff";
}

export const EditEntityStaff = ({ category }: EditEntityStaffProps) => {
  const userId = useAppSelector(selectCurrentUserId);
  const [searchTerm, setSearchTerm] = useState("");
  const isSupportersSearch = category === "donors";
  const { data, isLoading } = useGetAllRosterMembersQuery();
  const { data: donorsAndStaff } = useGetDonorsAndStaffQuery({ userId });
  const { data: darbeSearchResults = [], isFetching: isSearchingDarbe } =
    useGetSearchResultsQuery(searchTerm, {
      skip: !isSupportersSearch || searchTerm.trim().length < 2,
    });
  const { eligibleStaff } = data || {};
  const [addToDonors] = useAddToDonorsMutation();
  const [addToStaff] = useAddToStaffMutation();
  const mutationToUse = category === "donors" ? addToDonors : addToStaff;

  const currentSupporterIds = useMemo(
    () => new Set((donorsAndStaff?.donors ?? []).map((supporter) => supporter.id)),
    [donorsAndStaff?.donors]
  );

  const filteredStaff = useMemo(() => {
    const staffRows = eligibleStaff ?? [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return staffRows;

    return staffRows.filter((user) => {
      const name =
        user.fullName ||
        user.organizationName ||
        user.nonprofitName ||
        "";
      return name.toLowerCase().includes(query);
    });
  }, [eligibleStaff, searchTerm]);

  const supporterResults = useMemo(
    () =>
      darbeSearchResults
        .filter((user) => user.id !== userId)
        .filter((user) => !currentSupporterIds.has(user.id))
        .map((user) => ({
          id: user.id,
          fullName:
            user.fullName ||
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          organizationName: user.organizationName,
          nonprofitName: user.nonprofitName,
          profilePicture: user.profilePicture,
        })),
    [currentSupporterIds, darbeSearchResults, userId]
  );

  const rowsToRender = isSupportersSearch ? supporterResults : filteredStaff;
  const isLoadingRows = isSupportersSearch ? isSearchingDarbe : isLoading;

  const handleDataFiltering = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className={styles.editEntityStaff}>
      {isLoadingRows && <CircularProgress />}
      <LocalSearchBar
        placeholder={
          isSupportersSearch
            ? "Search Darbe for supporters"
            : "Search for your roster members"
        }
        onChange={handleDataFiltering}
      />
      {rowsToRender?.map((user) => (
        <div key={user?.id} className={styles.rosterRow}>
          <UserAvatars
            profilePicture={user?.profilePicture}
            fullName={
              user?.fullName || user?.organizationName || user?.nonprofitName
            }
          />
          <IconButton
            sx={{ backgroundColor: "white" }}
            onClick={() => mutationToUse({ userId: user?.id })}
          >
            <AddCircle sx={{ color: "#2c77e7" }} />
          </IconButton>
        </div>
      ))}
    </div>
  );
};
