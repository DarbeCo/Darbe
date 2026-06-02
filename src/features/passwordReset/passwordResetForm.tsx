import { useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DarbeButton } from "../../components/buttons/DarbeButton";
import { PasswordResetRequestState, PasswordResetConfirmState } from "./types";
import { PasswordResetRequestForm } from "./passwordResetRequestForm";
import { PasswordResetHeaders } from "./passwordResetHeaders";
import { NewPasswordForm } from "./newPasswordForm";
import { useResetPasswordMutation, useUpdatePasswordMutation } from "../../services/api/endpoints/passwordReset/passwordReset.api";

import styles from "./styles/passwordResetPage.module.css";

export const PasswordResetForm = () => {
  const [searchParams] = useSearchParams();
  const isConfirmStep = searchParams.get("type") === "recovery";
  
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const navigate = useNavigate();

  const [resetPasswordData, setResetPasswordData] = useState<PasswordResetRequestState>({
    email: "",
  });

  const [confirmPasswordData, setConfirmPasswordData] = useState<PasswordResetConfirmState>({
    password: "",
    confirmPassword: "",
  });

  const [resetPassword, { isLoading: isResetLoading }] = useResetPasswordMutation();
  const [updatePassword, { isLoading: isUpdateLoading }] = useUpdatePasswordMutation();

  const handleResetPasswordRequest = async () => {
    try {
      setError("");
      const trimmedEmail = resetPasswordData.email.trim();
      
      if (!trimmedEmail) {
        setError("Email is required.");
        return;
      }

      await resetPassword({ email: trimmedEmail }).unwrap();
      setSuccessMessage("Password reset email sent! Check your inbox for further instructions.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Error requesting password reset", error);
      setError((error as any).data?.message || "Failed to send reset email. Please try again.");
    }
  };

  const handleConfirmPasswordReset = async () => {
    try {
      setError("");
      const { password, confirmPassword } = confirmPasswordData;

      if (!password || !confirmPassword) {
        setError("Both password fields are required.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      await updatePassword({ password, confirmPassword }).unwrap();
      setSuccessMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error updating password", error);
      setError((error as any).data?.message || "Failed to update password. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isConfirmStep) {
        handleConfirmPasswordReset();
      } else {
        handleResetPasswordRequest();
      }
    }
  };

  const isLoading = isResetLoading || isUpdateLoading;

  return (
    <div className={styles.formArea}>
      <>
        <PasswordResetHeaders isConfirmStep={isConfirmStep} />
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {isLoading && <CircularProgress />}
      </>
      <form onKeyDown={handleKeyPress} className={styles.form}>
        {isConfirmStep ? (
          <NewPasswordForm
            handleChange={setConfirmPasswordData}
            values={confirmPasswordData}
          />
        ) : (
          <PasswordResetRequestForm handleChange={setResetPasswordData} />
        )}
        <div className={styles.buttonArea}>
          <DarbeButton
            buttonText={isConfirmStep ? "Update Password" : "Send Reset Email"}
            onClick={isConfirmStep ? handleConfirmPasswordReset : handleResetPasswordRequest}
            darbeButtonType="primaryButton"
            isDisabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
};
