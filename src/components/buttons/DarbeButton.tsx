import { Button } from "@mui/material";
import {
  signUpButton,
  primaryButton,
  secondaryButton,
  dangerButton,
  warningButton,
  postButton,
  causesButton,
  causesButtonBlue,
  postActionButton,
  showMore,
  profileButtons,
  friendRequestButton,
  messageFriendButton,
  saveButton,
  nextButton,
  secondaryNextButton,
  rosterButton,
} from "./buttonStyles";
import { CustomSvgs } from "../customSvgs/CustomSvgs";

// TODO: Clean up the buttons when we get good design system
type DarbeButtonType =
  | "signUpButton"
  | "primaryButton"
  | "secondaryButton"
  | "dangerButton"
  | "warningButton"
  | "postButton"
  | "causesButton"
  | "causesButtonBlue"
  | "postActionButton"
  | "profileButtons"
  | "saveButton"
  | "nextButton"
  | "secondaryNextButton"
  | "showMore"
  | "friendRequestButton"
  | "messageFriendButton"
  | "rosterButton";

interface ButtonProps {
  buttonText: string;
  darbeButtonType: DarbeButtonType;
  onClick?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "text" | "outlined" | "contained";
  startingIconPath?: string;
  endingIconPath?: React.ReactNode;
  isDisabled?: boolean;
}

// TODO: Too many buttons, remove the useless ones, keep it simple
export const DarbeButton = ({
  buttonText,
  onClick,
  isDisabled,
  startingIconPath,
  endingIconPath,
  darbeButtonType,
}: ButtonProps) => {
  const sxDefinitions: Record<DarbeButtonType, object> = {
    signUpButton,
    primaryButton,
    secondaryButton,
    dangerButton,
    warningButton,
    postButton,
    causesButton,
    causesButtonBlue,
    postActionButton,
    showMore,
    profileButtons,
    friendRequestButton,
    messageFriendButton,
    saveButton,
    nextButton,
    secondaryNextButton,
    rosterButton,
  };
  const darbeButtonSx = sxDefinitions[darbeButtonType];
  const startingElement = startingIconPath && (
    <CustomSvgs svgPath={startingIconPath} altText={buttonText} />
  );
  const endingElement = endingIconPath && (
    <CustomSvgs svgPath={endingIconPath as string} altText={buttonText} />
  );
  return (
    <>
      <Button
        disabled={isDisabled}
        sx={darbeButtonSx}
        onClick={onClick}
        startIcon={startingElement}
        endIcon={endingElement}
      >
        {buttonText}
      </Button>
    </>
  );
};
