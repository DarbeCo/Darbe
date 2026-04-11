import { useState, useEffect } from "react";

// TODO: Probs no needed?
export const useLocation = () => {
  const [location, setLocation] = useState(window.location);

  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(window.location);
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return location;
};
