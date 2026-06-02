import { PasswordResetTopBar } from "./passwordResetTopBar";
import { ClosingIcon } from "../../components/closingIcon/ClosingIcon";
import { PasswordResetForm } from "./passwordResetForm";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/passwordResetPage.module.css";

export const PasswordReset = () => {
  const { isDesktop } = useScreenWidthHook();
  const backgroundImage = assetUrl("/images/signupDesktopImage.png");

  return (
    <div className={styles.page}>
      {!isDesktop && (
        <>
          <PasswordResetTopBar />
          <ClosingIcon horizontalPlacement="right" />
          <PasswordResetForm />
        </>
      )}
      {isDesktop && (
        <>
          <PasswordResetTopBar />
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <PasswordResetForm />
          </div>
        </>
      )}
    </div>
  );
};


