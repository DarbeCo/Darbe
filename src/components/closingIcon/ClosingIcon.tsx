import { Close } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface ClosingIconProps {
  location?: string;
  onClick?: () => void;
  horizontalPlacement?: "left" | "right";
  verticalPlacement?: "top" | "bottom";
  useNoSx?: boolean;
}

export const ClosingIcon = ({
  location,
  onClick,
  horizontalPlacement,
  verticalPlacement,
  useNoSx,
}: ClosingIconProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (location) {
      navigate(location);
    } else if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  const sxPlacement = {
    position: "relative",
    width: "100%",
    justifyContent: horizontalPlacement === "left" ? "flex-start" : "flex-end",
    alignContent: verticalPlacement === "top" ? "flex-start" : "flex-end",
    "&:hover": {
      backgroundColor: "transparent",
    },
  };

  const sxDefinition = useNoSx ? {} : sxPlacement;

  return (
    <IconButton onClick={handleClick} sx={sxDefinition}>
      <Close />
    </IconButton>
  );
};
