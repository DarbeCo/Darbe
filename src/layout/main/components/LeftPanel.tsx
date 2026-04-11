import { DarbeAvatar } from "../../../components/avatars/DarbeAvatar";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { MiniMenu } from "../../../components/miniMenu/MiniMenu";
import { SideNavBar } from "./SideNavBar";
import { SimpleLinks } from "../../../components/simpleLinks/SimpleLinks";

import styles from "../styles/mainPage.module.css";

export const LeftPanel = () => {
  return (
    <div className={styles.leftDesktopPanel}>
      <CustomSvgs
        svgPath="/svgs/common/darbeLogo.svg"
        altText="darbe Logo"
        variant="noBounds"
      />
      <SideNavBar />

      <div className={styles.leftDesktopPanelAvatarMenu}>
        <DarbeAvatar variant="large" showUserName />
        <MiniMenu />
      </div>

      <div className={styles.simpleLinksArea}>
        <SimpleLinks direction="column" />
      </div>
    </div>
  );
};
