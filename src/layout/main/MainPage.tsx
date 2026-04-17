import { Outlet, useLocation } from "react-router-dom";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { NavBar } from "./components/NavBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { Modal } from "../../components/modal/Modal";
import { SearchBar } from "../../components/searchBar/SearchBar";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { VolunteerCarouselCards } from "../../components/volunteerStats/VolunteerCarouselCards";
import { Feed } from "../../features/feed/Feed";
import { useAppSelector } from "../../services/hooks";
import { selectUser } from "../../features/users/selectors";
import { MESSAGING_ROUTE } from "../../routes/route.constants";
import { DesktopMessagingDrawer } from "../../components/messaging/DesktopMessagingDrawer";

import styles from "./styles/mainPage.module.css";

// TODO: This won't be maintainable. Just chuck the mobile version or simplify the designs tbh
export const Home = () => {
  const user = useAppSelector(selectUser);
  const { isMobile, isTablet, isDesktop } = useScreenWidthHook();
  const location = useLocation();
  const pathName = location.pathname.split("/");
  const isHomePage = pathName.length === 2;
  const hideSearchBar = pathName.includes("profile_edit");
  const hideNavBar = pathName.includes("profile_edit");
  const hideBottomNavBar = pathName.includes("profile_edit");
  const hideDesktopMessagingDrawer = location.pathname.startsWith(MESSAGING_ROUTE);
  const showSuggestedFriends =
    pathName.length > 2 && user.user?.userType === "individual";

  return (
    <div className={styles.homePage}>
      {isMobile && (
        <>
          {!hideNavBar && <NavBar />}
          {!hideSearchBar && (
            <SearchBar showMessageIcon={true} showAvatar={true} />
          )}
          {isHomePage && <VolunteerCarouselCards />}
          <Outlet />
          {isHomePage && <Feed />}
          {!hideBottomNavBar && <BottomNavBar />}
          <Modal />
        </>
      )}
      {isTablet && (
        <>
          {!hideNavBar && <NavBar />}
          {isHomePage && <VolunteerCarouselCards />}
          <Outlet />
          {isHomePage && <Feed />}
          <BottomNavBar />
          <Modal />
        </>
      )}
      {isDesktop && (
        <div className={styles.desktopLayout}>
          <div className={styles.leftSide}>
            <LeftPanel />
          </div>
          <div className={styles.centerContent}>
            <SearchBar showMessageIcon={false} showAvatar={false} />
            {isHomePage && <Feed />}
            <Outlet />
          </div>

          <div className={styles.rightSide}>
            <RightPanel showSuggestedFriends={showSuggestedFriends} />
          </div>
          {!hideDesktopMessagingDrawer && <DesktopMessagingDrawer />}
          <Modal />
        </div>
      )}
    </div>
  );
};
