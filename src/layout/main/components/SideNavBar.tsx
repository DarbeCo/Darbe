import { useState } from "react";
import { useSelector } from "react-redux";
import { Menu } from "@mui/material";

import {
  EVENTS_ROUTE,
  HOME_ROUTE,
  IMPACT_ROUTE,
  MATCH_ROUTE,
  MESSAGING_ROUTE,
  NOTIFICATIONS_ROUTE,
  POST_A_DONATION,
  POST_A_NEED,
} from "../../../routes/route.constants";
import { useNavigateHook } from "../../../utils/commonHooks/UseNavigate";
import { useLocation } from "../../../utils/commonHooks/UseLocation";
import { selectUser } from "../../../features/users/selectors";
import {
  showModal,
  setModalType,
  MODAL_TYPE,
} from "../../../components/modal/modalSlice";
import { useAppDispatch } from "../../../services/hooks";
import { useModal } from "../../../utils/commonHooks/UseModal";
import { MiniMenuItems } from "../../../components/miniMenu/MiniMenuItems";
import { NavBarItem } from "./NavBarItem";

import styles from "../styles/mainPage.module.css";

export const SideNavBar = () => {
  const { user } = useSelector(selectUser);
  const isIndividual = user?.userType === "individual";
  const userId = user?.id ?? "";
  const navigate = useNavigateHook();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isVisible, hide, toggle } = useModal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    if (route === "messages") {
      navigate(`${MESSAGING_ROUTE}/${userId}`);
    }
    if (route === "notifications") {
      navigate(`${NOTIFICATIONS_ROUTE}`);
    }
  };

  const handleCreatePost = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  const determineCSS = (navBarItem: string) => {
    const pathname = location.pathname.replace(/\/+$/, "");

    if (navBarItem === "home") {
      return pathname === HOME_ROUTE;
    }

    if (navBarItem === "messages") {
      return pathname.startsWith(MESSAGING_ROUTE);
    }

    if (navBarItem === "notifications") {
      return pathname.startsWith(NOTIFICATIONS_ROUTE);
    }

    return pathname.startsWith(`/home/${navBarItem}`);
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
        handleCreatePost(event),
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
    {
      onClick: () => handleClick("notifications"),
      svgPath: "/svgs/common/notificationsDesktopIcon.svg",
      altText: "impact",
      text: "Notifications",
    },
    {
      onClick: () => handleClick("messages"),
      svgPath: "/svgs/common/messagesIcon.svg",
      altText: "messages",
      text: "Messages",
    },
  ];

  return (
    <div className={styles.sideNavBar}>
      <div className={styles.sideNavBarItem}>
        {navBarItems.map((item, index) => (
          <NavBarItem
            key={index}
            onClick={item.onClick}
            svgPath={item.svgPath}
            altText={item.altText}
            text={item.text}
            isBlue={determineCSS(item.text.toLowerCase())}
            variant="default"
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
