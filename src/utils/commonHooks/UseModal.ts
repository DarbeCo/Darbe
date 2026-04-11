import { useState, useCallback } from "react";

/**
 * Use this for a basic modal show/hide/toggle functionality
 */
export const useModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible((prev) => !prev), []);

  return {
    isVisible,
    show,
    hide,
    toggle,
  };
};
