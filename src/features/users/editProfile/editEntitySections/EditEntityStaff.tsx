import { useState } from "react";
import { AddCircle } from "@mui/icons-material";
import { CircularProgress, IconButton } from "@mui/material";

import { UserAvatars } from "../../../../components/avatars/UserAvatars";
import { useGetAllRosterMembersQuery } from "../../../../services/api/endpoints/roster/roster.api";
import {
  useAddToDonorsMutation,
  useAddToStaffMutation,
} from "../../../../services/api/endpoints/profiles/profiles.api";
import { LocalSearchBar } from "../../../../components/searchBar/LocalSearchBar";

import styles from "../styles/profileEdit.module.css";

interface EditEntityStaffProps {
  category: "donors" | "staff";
}

export const EditEntityStaff = ({ category }: EditEntityStaffProps) => {
  const { data, isLoading } = useGetAllRosterMembersQuery();
  const { eligibleDonors, eligibleStaff } = data || {};
  const [addToDonors] = useAddToDonorsMutation();
  const [addToStaff] = useAddToStaffMutation();
  const dataToIterateOver =
    category === "donors" ? eligibleDonors : eligibleStaff;
  const [filteredData, setFilteredData] = useState(dataToIterateOver);
  const mutationToUse = category === "donors" ? addToDonors : addToStaff;

  const handleDataFiltering = (value: string) => {
    if (!value) {
      setFilteredData(dataToIterateOver);
      return;
    }

    const lowerCasedValue = value.toLowerCase();
    const filtered = dataToIterateOver?.filter((user) =>
      user?.fullName.toLowerCase().includes(lowerCasedValue)
    );
    setFilteredData(filtered);
  };

  return (
    <div className={styles.editEntityStaff}>
      {isLoading && <CircularProgress />}
      <LocalSearchBar
        placeholder={`Search for your roster members`}
        onChange={handleDataFiltering}
      />
      {filteredData?.map((user) => (
        <div key={user?.id} className={styles.rosterRow}>
          <UserAvatars
            profilePicture={user?.profilePicture}
            fullName={user?.fullName}
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
