import { useState } from "react";
import { useSelector } from "react-redux";
import { IconButton, Menu } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { selectUser } from "../../features/users/selectors";
import { useNavigateHook } from "../../utils/commonHooks/UseNavigate";
import {
  FRIENDS_ROUTE,
  HELP_ROUTE,
  LOGOUT_ROUTE,
  MESSAGING_ROUTE,
  PRIVACY_ROUTE,
  PROFILE_ROUTE,
  ROSTER_ROUTE,
} from "../../routes/route.constants";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { MiniMenuItems } from "./MiniMenuItems";

import style from "./styles/miniMenu.module.css";

export const MiniMenu = () => {
  const { user } = useSelector(selectUser);
  const { isDesktop } = useScreenWidthHook();
  const userId = user?.id ?? "";
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigateHook();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (route: string) => {
    handleClose();

    if (route === "profile" || route === "editProfile") {
      navigate(`${PROFILE_ROUTE}/${userId}`);
    }
    if (route === "roster") {
      navigate(`${ROSTER_ROUTE}`);
    }
    if (route === "friends" || route === "followers") {
      navigate(`${FRIENDS_ROUTE}`);
    }
    if (route === "help") {
      navigate(`${HELP_ROUTE}`);
    }
    if (route === "privacy") {
      navigate(`${PRIVACY_ROUTE}`);
    }
    if (route === "logout") {
      navigate(`${LOGOUT_ROUTE}`);
    }
    if (route === "messages") {
      navigate(`${MESSAGING_ROUTE}/${userId}`);
    }
  };

  const isEntity = user?.userType !== "individual";
  const friendTextToShow = isEntity ? "followers" : "friends";
  const desktopOptions = ["editProfile", friendTextToShow, "logout"];
  const nonDesktopOptions = [
    "profile",
    "messages",
    friendTextToShow,
    "help",
    "privacy",
    "logout",
  ];

  if (isEntity) {
    desktopOptions.splice(1, 0, "roster");
    nonDesktopOptions.splice(1, 0, "roster");
  }

  const nonDesktopItems = nonDesktopOptions.map((option) => (
    <MiniMenuItems key={option} onClick={handleMenuClick} routeName={option} />
  ));
  const desktopItems = desktopOptions.map((option) => (
    <MiniMenuItems key={option} onClick={handleMenuClick} routeName={option} />
  ));
  return (
    <div className={style.hamburgerMenu}>
      <IconButton onClick={handleClick}>
        {isDesktop ? (
          <ExpandMore />
        ) : (
          <CustomSvgs
            svgPath="/svgs/common/hamburgerMenuIcon.svg"
            altText="hamburger menu"
          />
        )}
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {isDesktop ? desktopItems : nonDesktopItems}
      </Menu>
    </div>
  );
};
