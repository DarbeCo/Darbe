import { Menu } from "@mui/material";
import React, { useState } from "react";
import { useSelector } from "react-redux";

import {
  EVENTS_ROUTE,
  HOME_ROUTE,
  IMPACT_ROUTE,
  MATCH_ROUTE,
  POST_A_DONATION,
  POST_A_NEED,
} from "../../../routes/route.constants";
import { useNavigateHook } from "../../../utils/commonHooks/UseNavigate";
import { useLocation } from "../../../utils/commonHooks/UseLocation";
import { showModal, setModalType, MODAL_TYPE } from "../../../components/modal/modalSlice";
import { useAppDispatch } from "../../../services/hooks";
import { selectUser } from "../../../features/users/selectors";
import { useModal } from "../../../utils/commonHooks/UseModal";
import { MiniMenuItems } from "../../../components/miniMenu/MiniMenuItems";
import { NavBarItem } from "./NavBarItem";

import styles from "../styles/mainPage.module.css";

export const BottomNavBar = () => {
  const navigate = useNavigateHook();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isVisible, hide, toggle } = useModal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const user = useSelector(selectUser);
  const isIndividual = user?.user?.userType === "individual";

  const handleClick = (route: string) => {
    if (route === "home") {
      navigate(`${HOME_ROUTE}`);
    }
    if (route === "events") {
      navigate(`${EVENTS_ROUTE}`);
    }
    if (route === "match") {
      navigate(`${MATCH_ROUTE}`);
    }
    if (route === "impact") {
      navigate(`${IMPACT_ROUTE}`);
    }
  };

  const handleCreateButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (isIndividual) {
      dispatch(setModalType(MODAL_TYPE.createPost));
      dispatch(showModal());
    } else {
      setAnchorEl(event.currentTarget);
      toggle();
    }
  };

  const handleEntityOptions = (route: string) => {
    toggle();
    if (route === "postANeed") {
      navigate(`${POST_A_NEED}`);
    }
    if (route === "postADonation") {
      navigate(`${POST_A_DONATION}`);
    }
    if (route === "createAPost") {
      dispatch(setModalType(MODAL_TYPE.createPost));
      dispatch(showModal());
    }
  };

  const navBarItemText =
    location.pathname.split("/")[location.pathname.split("/").length - 1];
  const determineCSS = (navBarItem: string) => {
    return navBarItem === navBarItemText;
  };

  const navBarItems = [
    {
      onClick: () => handleClick("home"),
      svgPath: "/svgs/common/homeIcon.svg",
      altText: "home",
      text: "Home",
    },
    {
      onClick: () => handleClick("events"),
      svgPath: "/svgs/common/eventsIcon.svg",
      altText: "events",
      text: "Events",
    },
    {
      onClick: (event: React.MouseEvent<HTMLButtonElement>) =>
        handleCreateButtonClick(event),
      svgPath: "/svgs/common/createPostMobileIcon.svg",
      altText: "create post icon",
      text: "Post",
    },
    {
      onClick: () => handleClick("match"),
      svgPath: "/svgs/common/matchIcon.svg",
      altText: "match",
      text: "Match",
    },
    {
      onClick: () => handleClick("impact"),
      svgPath: "/svgs/common/impactIcon.svg",
      altText: "impact",
      text: "Impact",
    },
  ];

  return (
    <div className={styles.bottomNavBar}>
      <div className={styles.bottomNavBarItem}>
        {navBarItems.map((item, index) => (
          <NavBarItem
            key={index}
            onClick={item.onClick}
            svgPath={item.svgPath}
            altText={item.altText}
            text={item.text}
            isBlue={determineCSS(item.text.toLowerCase())}
          />
        ))}
        {isVisible && (
          <Menu
            id="entity-creation-options"
            anchorEl={anchorEl}
            open={isVisible}
            onClose={hide}
            MenuListProps={{ "aria-labelledby": "basic-button" }}
          >
            <MiniMenuItems
              onClick={handleEntityOptions}
              routeName="postANeed"
            />
            <MiniMenuItems
              onClick={handleEntityOptions}
              routeName="postADonation"
            />
            <MiniMenuItems
              onClick={handleEntityOptions}
              routeName="createAPost"
            />
          </Menu>
        )}
      </div>
    </div>
  );
};
