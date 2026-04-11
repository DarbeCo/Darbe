import { SignUpState } from "../../../../features/signup/types";
import { darbeBaseApi } from "../darbe.api";
import { checkEmailAvailability, signUpWithProfile } from "../../../darbeService";
import { AuthResponse } from "../types/user.api.types";

const signupApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkEmailAvailability: builder.query<{ available: boolean }, string>({
      async queryFn(email) {
        try {
          const available = await checkEmailAvailability(email);
          return { data: { available } };
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
    submitSignUp: builder.mutation<AuthResponse, SignUpState>({
      async queryFn(signUpData) {
        try {
          const user = await signUpWithProfile(signUpData);
          return {
            data: {
              message: "User created successfully",
              token: "",
              user,
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

export const { useCheckEmailAvailabilityQuery, useLazyCheckEmailAvailabilityQuery, useSubmitSignUpMutation } = signupApi;
