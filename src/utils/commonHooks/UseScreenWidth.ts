import { useState, useEffect } from "react";

const useScreenWidthHook = (): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;

      if (width >= 1260) {
        isDesktop = true;
      } else if (width >= 560 && width < 1260) {
        isTablet = true;
      } else if (width >= 250 && width < 560) {
        isMobile = true;
      }

      setScreenSize((prevScreenSize) => {
        if (
          prevScreenSize.isMobile !== isMobile ||
          prevScreenSize.isTablet !== isTablet ||
          prevScreenSize.isDesktop !== isDesktop
        ) {
          return { isMobile, isTablet, isDesktop };
        }
        return prevScreenSize;
      });
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screenSize;
};

export default useScreenWidthHook;
