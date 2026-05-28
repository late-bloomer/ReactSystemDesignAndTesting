/**
 * Tiny theme context — exposes a theme string and a toggle function.
 *
 * Three things exported, each independently testable:
 *   1. ThemeContext     → the raw React.Context — for inline Provider wrappers
 *   2. ThemeProvider    → wraps children and owns the state internally
 *   3. useTheme         → consumer hook with a clear error message if unwrapped
 */
import { createContext, useContext, useState } from "react";

// Default value used ONLY when a consumer is rendered without a Provider.
// We deliberately set it to undefined so useTheme can detect that and throw.
export const ThemeContext = createContext(undefined);

export function ThemeProvider({ children, initialTheme = "light" }) {
  const [theme, setTheme] = useState(initialTheme);

  const toggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Consumer hook with a friendly error when used outside the Provider —
// this is the canonical pattern for any context.
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}
