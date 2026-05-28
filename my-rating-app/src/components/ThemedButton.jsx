/**
 * ThemedButton — a consumer of ThemeContext.
 *
 * Demonstrates a component that reads from React Context. Used by
 * ReduxAndContext.test.jsx to demonstrate Provider-wrapping in tests.
 */
import { useTheme } from "../contexts/ThemeContext";

export function ThemedButton({ children }) {
  const { theme, toggle } = useTheme();
  return (
    <button className={`btn-${theme}`} onClick={toggle}>
      {children} ({theme})
    </button>
  );
}
