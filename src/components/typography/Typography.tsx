import React from "react";
import styles from "./styles/typography.module.css";

export type TypographyVariants =
  | "text"
  | "whiteBoldText"
  | "smallTimeStamp"
  | "nameHeader"
  | "header"
  | "tagline"
  | "informational"
  | "grayText"
  | "locationSmall"
  | "locationRegular"
  | "sectionTitle"
  | "entityTitleSmall"
  | "blueTextSmall"
  | "blueTextNormal"
  | "boldTextSmall"
  | "greenTextSmall"
  | "tabs";

interface TypographyProps {
  variant: TypographyVariants;
  textToDisplay?: string | number;
  extraClass?: string;
  onClick?: () => void;
  truncationLength?: number;
  customStyles?: React.CSSProperties
}

// TODO: Maybe rework to take children and have a popup state
export const Typography = ({
  variant,
  textToDisplay,
  extraClass = "",
  onClick,
  truncationLength,
  customStyles
}: TypographyProps) => {
  const classDefinitions: Record<TypographyVariants, string> = {
    text: "text",
    smallTimeStamp: "smallTimeStamp",
    nameHeader: "nameHeader",
    whiteBoldText: "whiteBoldText",
    header: "header",
    tagline: "tagline",
    informational: "informational",
    grayText: "grayText",
    locationSmall: "locationSmall",
    locationRegular: "locationRegular",
    sectionTitle: "sectionTitle",
    entityTitleSmall: "entityTitleSmall",
    blueTextSmall: "blueTextSmall",
    blueTextNormal: "blueTextNormal",
    boldTextSmall: "boldTextSmall",
    greenTextSmall: "greenTextSmall",
    tabs: "tabs",
  };

  const typographyClassName = classDefinitions[variant];

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const determineTextDisplay = () => {
    if (truncationLength && textToDisplay) {
      const text = textToDisplay.toString();

      if (text.length > truncationLength) {
        return `${text.substring(0, truncationLength)}...`;
      } else {
        return text;
      }
    } else {
      return textToDisplay;
    }
  };

  return (
    <span
      className={`${styles[typographyClassName]} ${extraClass}`}
      style={customStyles}
      onClick={handleClick}
    >
      {determineTextDisplay()}
    </span>
  );
};
