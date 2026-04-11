import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";

import { useLogoutMutation } from "../../../services/api/endpoints/logout/logout.api";
import { useAppDispatch } from "../../../services/hooks";

export const Logout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout().unwrap();
        dispatch({ type: "LOGOUT" });
        navigate("/login");
      } catch (error) {
        console.error("Failed to logout:", error);
      }
    };

    performLogout();
  }, [logout, dispatch]);

  return <>{isLoading ? <CircularProgress /> : <h2>Logging out...</h2>}</>;
};
