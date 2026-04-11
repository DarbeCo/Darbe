import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";

import styles from "./styles/complexHeader.module.css";

interface ComplexHeaderProps {
  children: React.ReactNode;
}

export const ComplexHeader = ({ children }: ComplexHeaderProps) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleShowMenu = () => {};

  return (
    <div className={styles.complexHeader}>
      <div className={styles.complexHeaderUserArea}>
        <IconButton onClick={handleGoBack}>
          <CustomSvgs svgPath="/svgs/common/goBackIcon.svg" altText="Go back" />
        </IconButton>
        {children}
      </div>
      <IconButton onClick={handleShowMenu}>
        <CustomSvgs
          svgPath="/svgs/common/threeDotMenuIcon.svg"
          variant="small"
          altText="Menu"
        />
      </IconButton>
    </div>
  );
};
