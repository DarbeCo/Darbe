import { MenuItem } from "@mui/material";

export const Race = () => {
  const currentlySupportedRaces = [
    "American Indian or Alaskan Native",
    "Black or African American",
    "Asian",
    "Hispanic or Latino",
    "Native Hawaiian or Pacific Islander",
    "White",
    "Prefer not to answer",
  ].map((race) => (
    <MenuItem
      key={race}
      value={race}
      sx={{
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "19px",
        color: "#263238",
      }}
    >
      {race}
    </MenuItem>
  ));

  return currentlySupportedRaces;
};
