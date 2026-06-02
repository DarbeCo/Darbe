import { PasswordResetRequestState, PasswordResetConfirmState } from "../../../../features/passwordReset/types";
import { darbeBaseApi } from "../darbe.api";
import { resetPassword, updatePassword } from "../../../darbeService/auth";

interface PasswordResetResponse {
  message: string;
}

const passwordResetApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    resetPassword: builder.mutation<PasswordResetResponse, PasswordResetRequestState>({
      async queryFn({ email }) {
        try {
          await resetPassword(email);
          return {
            data: {
              message: "Password reset email sent successfully",
            },
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
    }),
    updatePassword: builder.mutation<PasswordResetResponse, PasswordResetConfirmState>({
      async queryFn({ password }) {
        try {
          await updatePassword(password);
          return {
            data: {
              message: "Password updated successfully",
            },
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
    }),
  }),
});

export const { useResetPasswordMutation, useUpdatePasswordMutation } = passwordResetApi;
