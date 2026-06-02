import styles from "./styles/passwordResetPage.module.css";

interface PasswordResetHeadersProps {
  isConfirmStep?: boolean;
}

export const PasswordResetHeaders = ({ isConfirmStep = false }: PasswordResetHeadersProps) => {
  return (
    <div className={styles.headers}>
      <span className={styles.boldText}>
        {isConfirmStep ? "Reset Your Password" : "Forgot Password?"}
      </span>
      <span className={styles.subtitleText}>
        {isConfirmStep
          ? "Enter your new password below"
          : "Enter your email address and we'll send you a link to reset your password"}
      </span>
    </div>
  );
};
