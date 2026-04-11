import { LoginState } from "../../../../features/login/types";
import { darbeBaseApi } from "../darbe.api";
import { signIn } from "../../../darbeService";
import { AuthResponse } from "../types/user.api.types";

const loginApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitLogin: builder.mutation<AuthResponse, LoginState>({
      async queryFn(loginData) {
        try {
          const user = await signIn(loginData.email, loginData.password);
          return {
            data: {
              message: "Login successful",
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

export const { useSubmitLoginMutation } = loginApi;
