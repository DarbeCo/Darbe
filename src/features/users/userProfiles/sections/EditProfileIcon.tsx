import { IconButton } from "@mui/material";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";

interface EditProfileIconProps {
  onClick: () => void;
  className?: string;
  useOtherIcon?: boolean;
  // TODO: Move this to a type for export
  variant?: "tiny" | "small" | "default" | "large" | "noBounds";
}

export const EditProfileIcon = ({
  onClick,
  className,
  useOtherIcon,
  variant = "tiny",
}: EditProfileIconProps) => {
  const svgPath = useOtherIcon
    ? "/svgs/common/addPhotoIcon.svg"
    : "/svgs/common/editProfileIcon.svg";
  return (
    <IconButton className={className} onClick={onClick}>
      <CustomSvgs
        svgPath={svgPath}
        altText="Edit Profile Icon"
        variant={variant}
      />
    </IconButton>
  );
};
