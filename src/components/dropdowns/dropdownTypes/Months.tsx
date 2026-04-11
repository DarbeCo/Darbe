import { MenuItem } from "@mui/material";

export const Months = () => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].map((month) => {
    return (
      <MenuItem
        key={month}
        value={month}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
        }}
      >
        {month}
      </MenuItem>
    );
  });

  return months;
};
