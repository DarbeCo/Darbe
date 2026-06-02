export interface PasswordResetRequestState {
  email: string;
}

export interface PasswordResetConfirmState {
  password: string;
  confirmPassword: string;
}
