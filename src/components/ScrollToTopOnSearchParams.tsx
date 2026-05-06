"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function ScrollToTopOnSearchParams() {
  const searchParams = useSearchParams();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [searchParams]);

  return null;
}
