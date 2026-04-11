import { MenuItem } from "@mui/material";
import {
  MILITARY_RANKS,
  MilitaryBranch,
} from "../../../features/users/userProfiles/constants";

export const MilitaryRank = (branch: MilitaryBranch | undefined) => {
  if (!branch) {
    return null;
  }

  const militaryRankOptions = MILITARY_RANKS[branch].map((option) => {
    return (
      <MenuItem
        key={option}
        value={option}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
          color: "#717070",
        }}
      >
        {option}
      </MenuItem>
    );
  });

  return militaryRankOptions;
};
