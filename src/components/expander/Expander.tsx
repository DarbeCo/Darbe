import React, { useState } from "react";

import styles from "./styles/expander.module.css";

interface ExpanderProps {
  children: React.ReactNode;
  elementsToShow: number;
  buttonText?: "See More" | "Show More";
  disabled?: boolean;
  onClick?: () => void;
}

const Expander = ({
  children,
  elementsToShow,
  buttonText = "See More",
  disabled = false,
  onClick,
}: ExpanderProps) => {
  const [expanded, setExpanded] = useState(false);

  // Turn to array since we won't always get more than 1 item
  const childArray = React.Children.toArray(children);

  const visibleChildren = expanded
    ? childArray
    : childArray.slice(0, elementsToShow);

  const handleExpand = () => {
    if (onClick) {
      onClick();
    }
    setExpanded(true);
  };

  // Always render the container so CSS module classes apply. Only show the button
  // when there are more children than elementsToShow and not expanded.
  return (
    <div className={styles.expanderContainer}>
      {visibleChildren}
      {!disabled && !expanded && childArray.length > elementsToShow && (
        <div className={styles.showMoreButton} onClick={handleExpand}>
          {buttonText}
        </div>
      )}
    </div>
  );
};

export default Expander;
