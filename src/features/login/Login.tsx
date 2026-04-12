import { LoginTopBar } from "./LoginTopBar";
import { ClosingIcon } from "../../components/closingIcon/ClosingIcon";
import { LoginForm } from "./LoginForm";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/loginPage.module.css";

export const Login = () => {
  const { isDesktop } = useScreenWidthHook();
  const backgroundImage = assetUrl("/images/signupDesktopImage.png");

  return (
    <div className={styles.loginPage}>
      {!isDesktop && (
        <>
          <LoginTopBar />
          <ClosingIcon horizontalPlacement="right" />
          <LoginForm />
        </>
      )}
      {isDesktop && (
        <>
          <LoginTopBar />
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <LoginForm />
          </div>
        </>
      )}
    </div>
  );
};
