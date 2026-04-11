import { useNavigate } from "react-router-dom";

// TODO: Probs not needed. is state kept across invocations?
export const useNavigateHook = () => {
  const navigate = useNavigate();

  return navigate;
};
