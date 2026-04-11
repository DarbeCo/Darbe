import { MenuItem } from "@mui/material";

export const Days = () => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
    const dayString = day.toString();

    return (
      <MenuItem
        key={dayString}
        value={dayString}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
        }}
      >
        {dayString}
      </MenuItem>
    );
  });

  return days;
};
