import { MenuItem } from "@mui/material";

export const MilitaryStatus = () => {
  const militaryStatusOptions = [
    "Inactive",
    "Active",
    "Reserve",
    "Veteran",
  ].map((option) => {
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

  return militaryStatusOptions;
};
