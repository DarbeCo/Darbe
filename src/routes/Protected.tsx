import { JSX } from "react";

import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "../features/users/selectors";

export const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const userId = useSelector(selectCurrentUserId);

  // TODO: What happens when cookie expires on server?
  if (!userId) {
    return <Navigate to="/login" />;
  }

  return element;
};
