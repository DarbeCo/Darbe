import { SignUpTopBar } from "./SignUpTopBar";
import { ClosingIcon } from "../../components/closingIcon/ClosingIcon";
import { SignUpForms } from "./SignUpForms";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/signUpPage.module.css";

export const SignUp = () => {
  const { isDesktop } = useScreenWidthHook();
  const backgroundImage = assetUrl("/images/signupDesktopImage.png");

  return (
    <div className={styles.signUpPage}>
      {!isDesktop && (
        <>
          <SignUpTopBar />
          <ClosingIcon horizontalPlacement="right" />
          <SignUpForms />
        </>
      )}
      {isDesktop && (
        <>
          <SignUpTopBar />
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className={styles.closingIconSignUp}>
              <ClosingIcon horizontalPlacement="right" />
            </div>
            <SignUpForms />
          </div>
        </>
      )}
    </div>
  );
};
