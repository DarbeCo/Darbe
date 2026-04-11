import { useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { DarbeButton } from "../../components/buttons/DarbeButton";
import { LoginState } from "./types";
import { LoginInputs } from "./LoginInputs";
import { LoginHeaders } from "./LoginHeaders";
import { useAppDispatch } from "../../services/hooks";
import { setUser } from "../users/userSlice";
import { useSubmitLoginMutation } from "../../services/api/endpoints/login/login.api";

import styles from "./styles/loginPage.module.css";

export const LoginForm = () => {
  const [error, setError] = useState<string>("");
  const [loginData, setLoginData] = useState<LoginState>({
    email: "",
    password: "",
  });
  const [submitLogin, { isLoading, isError }] = useSubmitLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError("");
      const trimmedEmail = loginData.email.trim();
      const password = loginData.password;
      if (!trimmedEmail || !password) {
        setError("Email and password are required.");
        return;
      }
      const result = await submitLogin({
        email: trimmedEmail,
        password,
      }).unwrap();

      dispatch(setUser(result.user));
      navigate("/home");
    } catch (error) {
      console.error("Error logging in", error);
      setError((error as any).data.message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className={styles.loginFormArea}>
      <>
        <LoginHeaders />
        {isError && <Alert severity="error">{error}</Alert>}
        {isLoading && <CircularProgress />}
      </>
      <form onKeyDown={handleKeyPress} className={styles.loginForm}>
        <LoginInputs handleChange={setLoginData} />
        <div className={styles.loginButtonArea}>
          <DarbeButton
            buttonText="Login"
            onClick={handleLogin}
            darbeButtonType="primaryButton"
          />
        </div>
      </form>
    </div>
  );
};
