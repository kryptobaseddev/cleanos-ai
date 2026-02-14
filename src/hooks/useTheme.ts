import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

export function useTheme() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    function applyTheme(mode: "light" | "dark" | "system") {
      const root = document.documentElement;
      if (mode === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", mode === "dark");
      }
    }

    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return { theme, setTheme };
}
