import { MenuItem } from "@mui/material";

export const Hours = () => {
  const options = [];

  for (let i = 0; i < 24; i += 0.5) {
    const hour = Math.floor(i);
    const minute = i % 1 === 0 ? "00" : "30";
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    options.push(
      <MenuItem
        key={`${displayHour}:${minute} ${period}`}
        value={i}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
        }}
      >
        {`${displayHour}:${minute} ${period}`}
      </MenuItem>
    );
  }

  return options;
};
