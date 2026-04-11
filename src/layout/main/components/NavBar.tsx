import darbeLogo from "/svgs/common/darbeLogo.svg";
import useScreenWidthHook from "../../../utils/commonHooks/UseScreenWidth";
import { Notifications } from "../../../components/notification/Notifications";
import { SearchBar } from "../../../components/searchBar/SearchBar";
import { MiniMenu } from "../../../components/miniMenu/MiniMenu";

import styles from "../styles/mainPage.module.css";

export const NavBar = () => {
  const { isMobile, isTablet } = useScreenWidthHook();

  return (
    <div className={styles.navBar}>
      {isMobile && (
        <>
          <img src={darbeLogo} alt="Darbe logo" />
          <Notifications />
          <MiniMenu />
        </>
      )}
      {isTablet && (
        <>
          <img src={darbeLogo} alt="Darbe logo" />
          <SearchBar isTabletMode showMessageIcon={false} showAvatar={false} />
          <Notifications />
          <MiniMenu />
        </>
      )}
    </div>
  );
};
