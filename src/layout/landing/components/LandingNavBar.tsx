import { useState } from "react";
import { Menu as MenuIcon } from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";
import darbeLogo from "/svgs/common/darbeLogo.svg";
import { assetUrl } from "../../../utils/assetUrl";
import useScreenWidthHook from "../../../utils/commonHooks/UseScreenWidth";

import styles from "../styles/landingComponents.module.css";

export const LandingNavBar = () => {
  const [anchorEl, setAnchorel] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorel(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorel(null);
  };

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { isDesktop } = useScreenWidthHook();

  return (
    <nav className={styles.landingNavBar}>
      <img src={assetUrl(darbeLogo)} alt="darbeLogo" />
      {!isDesktop && (
        <>
          <IconButton onClick={handleClick}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <MenuItem
              onClick={() => {
                handleScrollToSection("whatWeDo");
                handleClose();
              }}
              sx={{
                color: "#263238",
                fontSize: "18px",
                lineHeight: "25px",
                fontFamily: '"Open Sans", sans-serif',
                borderBottom: "1px solid #2c77e7",
              }}
            >
              What We Do
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleScrollToSection("faq");
                handleClose();
              }}
              sx={{
                color: "#263238",
                fontSize: "18px",
                lineHeight: "25px",
                fontFamily: '"Open Sans", sans-serif',
                borderBottom: "1px solid #2c77e7",
              }}
            >
              FAQ
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleScrollToSection("contactUs");
                handleClose();
              }}
              sx={{
                color: "#263238",
                fontSize: "18px",
                lineHeight: "25px",
                fontFamily: '"Open Sans", sans-serif',
                borderBottom: "1px solid #2c77e7",
              }}
            >
              Contact Us
            </MenuItem>
          </Menu>
        </>
      )}
      {isDesktop && (
        <div className={styles.navLinksDesktop}>
          <a className={styles.navLinkDesktopText} href="#whatWeDo">
            What We Do
          </a>
          <a className={styles.navLinkDesktopText} href="#faq">
            FAQ
          </a>
          <a className={styles.navLinkDesktopText} href="#contactUs">
            Contact Us
          </a>
        </div>
      )}
    </nav>
  );
};
