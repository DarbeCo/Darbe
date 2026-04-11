import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";
import { useState } from "react";

interface EndPasswordAdornmentProps {
  showPasswordText: () => void;
}

export const EndPasswordAdornment = ({
  showPasswordText,
}: EndPasswordAdornmentProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClick = () => {
    setShowPassword((prev) => !prev);
    showPasswordText();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  return (
    <InputAdornment position="start">
      <IconButton
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        edge="end"
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );
};
