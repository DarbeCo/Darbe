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
import { MESSAGING_ROUTE, POST_A_NEED } from "../../routes/route.constants";
import { DesktopMessagingDrawer } from "../../components/messaging/DesktopMessagingDrawer";

import styles from "./styles/mainPage.module.css";

// TODO: This won't be maintainable. Just chuck the mobile version or simplify the designs tbh
export const Home = () => {
  const user = useAppSelector(selectUser);
  const { isMobile, isTablet, isDesktop } = useScreenWidthHook();
  const location = useLocation();
  const pathName = location.pathname.split("/");
  const isHomePage = pathName.length === 2;
  const isPostNeedPage = location.pathname === POST_A_NEED;
  const isProfileEditPage = pathName.includes("profile_edit");
  const hideSearchBar = isProfileEditPage || isPostNeedPage;
  const hideNavBar = isProfileEditPage;
  const hideBottomNavBar = isProfileEditPage;
  const hideDesktopMessagingDrawer = location.pathname.startsWith(MESSAGING_ROUTE);
  const showSuggestedFriends =
    isPostNeedPage || (pathName.length > 2 && user.user?.userType === "individual");

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
        <div
          className={`${styles.desktopLayout} ${
            isProfileEditPage ? styles.profileEditDesktopLayout : ""
          }`}
        >
          <div className={styles.leftSide}>
            <LeftPanel />
          </div>
          <div
            className={`${styles.centerContent} ${
              isProfileEditPage ? styles.profileEditCenterContent : ""
            }`}
          >
            {!hideSearchBar && (
              <SearchBar showMessageIcon={false} showAvatar={false} />
            )}
            {isHomePage && <Feed />}
            <Outlet />
          </div>

          <div
            className={`${styles.rightSide} ${
              isProfileEditPage ? styles.profileEditRightSide : ""
            }`}
          >
            <RightPanel showSuggestedFriends={showSuggestedFriends} />
          </div>
          {!hideDesktopMessagingDrawer && <DesktopMessagingDrawer />}
          <Modal />
        </div>
      )}
    </div>
  );
};
