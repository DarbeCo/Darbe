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
import {
  MESSAGING_ROUTE,
  POST_A_NEED,
  PROFILE_ROUTE,
  ROSTER_ROUTE,
} from "../../routes/route.constants";
import { DesktopMessagingDrawer } from "../../components/messaging/DesktopMessagingDrawer";
import { useGetUserProfileQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useGetEntityEventCountsQuery } from "../../services/api/endpoints/events/events.api";
import { useGetEntityRosterAccessQuery } from "../../services/api/endpoints/roster/roster.api";

import styles from "./styles/mainPage.module.css";

// TODO: This won't be maintainable. Just chuck the mobile version or simplify the designs tbh
export const Home = () => {
  const user = useAppSelector(selectUser);
  const { isMobile, isTablet, isDesktop } = useScreenWidthHook();
  const location = useLocation();
  const pathName = location.pathname.split("/");
  const isHomePage = pathName.length === 2;
  const isPostNeedPage = location.pathname === POST_A_NEED;
  const isRosterPage = location.pathname.startsWith(ROSTER_ROUTE);
  const isCreateRosterView =
    isRosterPage &&
    new URLSearchParams(location.search).get("view") === "createRoster";
  const isMessagingPage = location.pathname.startsWith(MESSAGING_ROUTE);
  const isProfileEditPage = pathName.includes("profile_edit");
  const hideSearchBar =
    isProfileEditPage ||
    isPostNeedPage ||
    isMessagingPage ||
    isRosterPage ||
    isCreateRosterView;
  const hideNavBar = isProfileEditPage;
  const hideBottomNavBar = isProfileEditPage;
  const hideDesktopMessagingDrawer = isMessagingPage;

  const isProfileRoute = location.pathname.startsWith(`${PROFILE_ROUTE}/`);
  const viewedProfileUserId = isProfileRoute ? pathName[3] : undefined;
  const { data: viewedProfile } = useGetUserProfileQuery(
    viewedProfileUserId ?? "",
    { skip: !viewedProfileUserId }
  );
  const { data: currentUserProfile } = useGetUserProfileQuery(
    user.user?.id ?? "",
    { skip: !user.user?.id }
  );
  const viewedEntityName =
    viewedProfile?.user?.organizationName ||
    viewedProfile?.user?.nonprofitName ||
    viewedProfile?.organizationName ||
    viewedProfile?.nonprofitName;
  const viewedProfileUserType = viewedProfile?.user?.userType;
  const viewedProfileIsEntity =
    !!viewedProfile &&
    (viewedProfileUserType
      ? viewedProfileUserType !== "individual"
      : !!viewedEntityName);
  const { data: viewedProfileEventCounts } = useGetEntityEventCountsQuery(
    viewedProfileUserId ?? "",
    { skip: !viewedProfileUserId || !viewedProfileIsEntity }
  );
  const { data: viewedEntityRosterAccess } = useGetEntityRosterAccessQuery(
    viewedProfileUserId ?? "",
    { skip: !viewedProfileUserId || !viewedProfileIsEntity }
  );
  const normalizeOrgName = (name?: string) => name?.trim().toLowerCase();
  const normalizedViewedEntityName = normalizeOrgName(viewedEntityName);
  const currentUserIsViewedProfile = user.user?.id === viewedProfileUserId;
  const currentUserIsOrgMember =
    viewedEntityRosterAccess?.isMember ||
    currentUserIsViewedProfile ||
    currentUserProfile?.organizations?.some((organization) => {
      const organizationNameMatches =
        !!normalizedViewedEntityName &&
        normalizeOrgName(organization.organizationName) ===
          normalizedViewedEntityName;
      const parentOrganizationMatches =
        organization.parentOrganization?.id === viewedProfileUserId ||
        (!!normalizedViewedEntityName &&
          normalizeOrgName(organization.parentOrganization?.organizationName) ===
            normalizedViewedEntityName);

      return organizationNameMatches || parentOrganizationMatches;
    }) ||
    false;

  const showOrgOverview = isProfileRoute && viewedProfileIsEntity;
  const isProfileEntityPending = isProfileRoute && !viewedProfile;
  const viewedProfileFollowers = viewedProfile?.followers ?? [];
  const currentUserFollowingIds = new Set(
    currentUserProfile?.following?.map((following) => following.id) ?? []
  );
  const mutualFollowers = viewedProfileFollowers.filter((follower) =>
    currentUserFollowingIds.has(follower.id)
  );
  const orgOverviewProps = {
    followersCount: viewedProfileFollowers.length,
    mutualFollowers,
    mutualCount: mutualFollowers.length,
    partnersCount: viewedEntityRosterAccess?.memberCount ?? 0,
    businessSponsorsCount:
      viewedProfile?.entityDetails?.donorList?.length ?? 0,
    upcomingProjectsCount:
      viewedProfileEventCounts?.upcomingProjectsCount ?? 0,
    completedProjectsCount:
      viewedProfileEventCounts?.completedProjectsCount ?? 0,
    canViewRoster: currentUserIsOrgMember,
  };
  const showSuggestedFriends =
    !showOrgOverview &&
    !isProfileEntityPending &&
    (isPostNeedPage ||
      (pathName.length > 2 && user.user?.userType === "individual"));

  return (
    <div className={styles.homePage}>
      {isMobile && (
        <>
          {!hideNavBar && <NavBar hideSearchBar={hideSearchBar} />}
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
          {!hideNavBar && <NavBar hideSearchBar={hideSearchBar} />}
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
            } ${isMessagingPage ? styles.messagingCenterContent : ""}`}
          >
            {!hideSearchBar && (
              <SearchBar showMessageIcon={false} showAvatar={false} />
            )}
            {isHomePage && <Feed />}
            <Outlet />
          </div>

          {!isMessagingPage && (
            <div
              className={`${styles.rightSide} ${
                isProfileEditPage ? styles.profileEditRightSide : ""
              }`}
            >
              <RightPanel
                showSuggestedFriends={showSuggestedFriends}
                showOrgOverview={showOrgOverview}
                showRosterPanel={isRosterPage}
                orgOverviewProps={orgOverviewProps}
              />
            </div>
          )}
          {!hideDesktopMessagingDrawer && <DesktopMessagingDrawer />}
          <Modal />
        </div>
      )}
    </div>
  );
};
