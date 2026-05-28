/**
 * renderWithProviders — the canonical Redux/Context test helper.
 *
 * Wraps RTL's render() in BOTH a Redux <Provider> and a ThemeProvider so
 * any test can render a connected/context-aware component with one call.
 *
 * ─── DESIGN NOTES ───────────────────────────────────────────────────────────
 *
 *   • Each call creates a FRESH store via configureStore — tests are isolated
 *     from each other and from production code.
 *
 *   • `preloadedState` lets the test "arrange" the Redux state cheaply,
 *     instead of dispatching N actions before the render. This is the
 *     Redux-team-recommended pattern.
 *
 *   • The returned object includes the store so the test can also assert on
 *     final state (`store.getState()`) after interactions.
 *
 *   • `theme` lets the test set an initial ThemeContext value without
 *     building a fresh wrapper component every time.
 *
 *   • Anti-pattern (do NOT use): `redux-mock-store`. The Redux team itself
 *     recommends real stores in tests — middleware, async lifecycle, and
 *     selector behavior all need a real store to be tested accurately.
 */
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";

import counterReducer from "../store/counterSlice";
import { ThemeProvider } from "../contexts/ThemeContext";

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { counter: counterReducer },
      preloadedState,
    }),
    theme = "light",
    ...renderOptions
  } = {},
) {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
    </Provider>
  );

  // Return the store so tests can dispatch / read state after the render.
  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
