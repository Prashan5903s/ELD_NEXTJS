import { useState, useEffect } from "react";

export function useScreenWidth() {
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateScreenWidth = () => {
        setScreenWidth(window.innerWidth);
      };

      updateScreenWidth();

      window.addEventListener("resize", updateScreenWidth);

      return () => window.removeEventListener("resize", updateScreenWidth);
    }
  }, []);

  return {
    isSmallScreen: screenWidth !== null ? screenWidth < 1024 : false,
    isMobileDevice: screenWidth !== null ? screenWidth < 760 : false,
    screenWidth,
  };
}
