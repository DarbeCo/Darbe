import { MenuItem } from "@mui/material";

export const Rosters = (availableRosterNames: string[]) => {
  const rosters = availableRosterNames.map((roster) => {
    return (
      <MenuItem
        key={roster}
        value={roster}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
        }}
      >
        {roster}
      </MenuItem>
    );
  });

  return rosters;
};
