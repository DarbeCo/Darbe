import { MenuItem } from "@mui/material";

export const Genders = () => {
  const currentlySupportedGender = [
    "Male",
    "Female",
    "Non-Binary",
    "Transgender",
    "Prefer not to answer",
  ].map((gender) => (
    <MenuItem
      key={gender}
      value={gender}
      sx={{
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "19px",
        color: "#263238",
      }}
    >
      {gender}
    </MenuItem>
  ));

  return currentlySupportedGender;
};
