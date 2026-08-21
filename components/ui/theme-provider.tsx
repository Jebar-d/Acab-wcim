// components/theme-provider.tsx
"use client";

import * as React from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "acab-theme";
const THEME_EVENT = "acab-theme-change";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// getServerSnapshot's return value only matters for the very first server
// render; useSyncExternalStore re-renders with the real client value right
// after hydration, with no mismatch warning — that's the whole point of the
// hook, so we don't need a manual "mounted" guard anywhere.
function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — theme just
    // won't persist across reloads, which is fine.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribe,
    readTheme,
    getServerSnapshot,
  );

  const setTheme = React.useCallback((next: Theme) => {
    applyTheme(next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    applyTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
