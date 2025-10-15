import { useEffect, useState } from "react";

export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : true
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addEventListener(handler);
    setIsMobile(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeEventListener(handler);
    };
  }, [breakpoint]);

  return isMobile;
}
