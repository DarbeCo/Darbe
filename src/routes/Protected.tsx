import { JSX, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { supabase } from "../services/supabase/client";
import { useAppDispatch } from "../services/hooks";
import { clearUser } from "../features/users/userSlice";

type AuthState = "pending" | "authenticated" | "unauthenticated";

export const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>("pending");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user?.id) {
        setAuthState("authenticated");
      } else {
        dispatch(clearUser());
        setAuthState("unauthenticated");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session?.user?.id) {
        dispatch(clearUser());
        setAuthState("unauthenticated");
        return;
      }
      setAuthState("authenticated");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  if (authState === "pending") {
    return null;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};
