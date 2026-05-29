/**
 * ============================================================================
 *  ReduxAndContext.test.jsx — Teaching file for Redux Toolkit + React Context
 * ============================================================================
 *
 * THIS FILE: pure unit-style tests that don't touch the network at all.
 *   • Pure reducer / selector tests (no React, no store)
 *   • Connected component tests with preloadedState (no thunks)
 *   • Context tests with Provider-wrap (no jest.mock)
 *
 * COMPANION FILES (for the parts split out for symmetry):
 *   • ReduxThunkMSW.test.jsx       — thunk via MSW (network-layer mock)
 *   • ReduxThunkJestMock.test.jsx  — thunk via jest.mock(global.fetch)
 *   • ContextJestMock.test.jsx     — context consumer via jest.mock(hook)
 *
 * Read all four side-by-side to see how the same underlying behavior is
 * tested with different mocking strategies.
 *
 * ─── BIG-PICTURE MENTAL MODEL ───────────────────────────────────────────────
 *
 *   Both Redux and Context follow the same testing pattern:
 *     "Wrap the component in its Provider during render."
 *
 *   ┌──────────────────────────────────┬──────────────────────────────────┐
 *   │  Redux                           │  React Context                    │
 *   ├──────────────────────────────────┼──────────────────────────────────┤
 *   │  <Provider store={store}>        │  <ThemeContext.Provider value=…>  │
 *   │  useSelector / useDispatch       │  useContext / custom hook         │
 *   │  configureStore + preloadedState │  inline value or full Provider    │
 *   │  Reducers are pure functions     │  Provider often owns useState     │
 *   └──────────────────────────────────┴──────────────────────────────────┘
 *
 *   Both can be tested in three layers:
 *     1. PURE LOGIC      → reducer / selector / pure utility (no React)
 *     2. STATE LIFECYCLE → thunk / provider state transitions
 *     3. INTEGRATION     → component connected to the provider
 *
 *   This file covers LAYERS 1 and 3 for Redux, plus all Context patterns
 *   that use the Provider directly. Layer 2 (thunks) is split out so the
 *   mocking strategy can be compared cleanly across companion files.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import counterReducer, {
  increment,
  decrement,
  addBy,
  reset,
  selectCount,
  selectStatus,
} from "../store/counterSlice";
import {
  ThemeContext,
  ThemeProvider,
  useTheme,
} from "../contexts/ThemeContext";
import { Counter } from "../components/Counter";
import { ThemedButton } from "../components/ThemedButton";
import { renderWithProviders } from "../test-utils/renderWithProviders";

// ============================================================================
//  PART 1 — REDUX TOOLKIT
// ============================================================================

/**
 * ─── LAYER 1: PURE REDUCER TESTS ─────────────────────────────────────────────
 *
 *   A reducer is just `(state, action) => newState`. No React, no store, no
 *   Provider. These are the cheapest, fastest tests in your suite — and where
 *   ~99% of Redux bugs hide.
 *
 *   You call the reducer directly with an action object, then assert on the
 *   returned state. This is pure unit testing — no setup, no async, no DOM.
 */
describe("LAYER 1 — counter slice reducer (pure)", () => {
  test("returns the initial state when no action matches", () => {
    const state = counterReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({ value: 0, status: "idle", error: null });
  });

  test("increment adds 1 to value", () => {
    const prev = { value: 5, status: "idle", error: null };
    expect(counterReducer(prev, increment())).toEqual({
      value: 6,
      status: "idle",
      error: null,
    });
  });

  test("decrement subtracts 1", () => {
    const prev = { value: 5, status: "idle", error: null };
    expect(counterReducer(prev, decrement()).value).toBe(4);
  });

  test("addBy uses action.payload", () => {
    const prev = { value: 5, status: "idle", error: null };
    expect(counterReducer(prev, addBy(10)).value).toBe(15);
  });

  test("reset clears value, status, and error", () => {
    const prev = { value: 99, status: "failed", error: "boom" };
    expect(counterReducer(prev, reset())).toEqual({
      value: 0,
      status: "idle",
      error: null,
    });
  });

  test("selectors return the expected slice of state", () => {
    const rootState = { counter: { value: 7, status: "succeeded", error: null } };
    expect(selectCount(rootState)).toBe(7);
    expect(selectStatus(rootState)).toBe("succeeded");
  });
});

/**
 * ─── LAYER 3: CONNECTED COMPONENT TESTS (sync only — no thunks here) ─────────
 *
 *   Render a Counter inside a real <Provider store={…}> via the
 *   renderWithProviders helper.
 *
 *   `preloadedState` is the canonical way to "arrange" the initial state —
 *   cheaper and more declarative than dispatching N actions before the render.
 *
 *   Thunk-triggering tests (the "load from API" button) live in
 *   ReduxThunkMSW.test.jsx so the network-mocking strategy can be compared
 *   cleanly with ReduxThunkJestMock.test.jsx.
 *
 *   ANTI-PATTERN: redux-mock-store. The Redux team itself recommends real
 *   stores because mocks miss middleware behavior, async thunk lifecycle,
 *   and selector composition.
 */
describe("LAYER 3 — Counter connected component (sync only)", () => {
  test("renders the initial count from store", () => {
    renderWithProviders(<Counter />, {
      preloadedState: { counter: { value: 7, status: "idle", error: null } },
    });

    expect(screen.getByText(/Count: 7/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("status: idle");
  });

  test("clicking + dispatches increment", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Counter />, {
      preloadedState: { counter: { value: 0, status: "idle", error: null } },
    });

    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: "+" }));

    expect(screen.getByText(/Count: 2/)).toBeInTheDocument();
    expect(store.getState().counter.value).toBe(2);
  });

  test("clicking +5 dispatches addBy(5)", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Counter />, {
      preloadedState: { counter: { value: 10, status: "idle", error: null } },
    });

    await user.click(screen.getByRole("button", { name: "+5" }));

    expect(screen.getByText(/Count: 15/)).toBeInTheDocument();
    expect(store.getState().counter.value).toBe(15);
  });
});

// ============================================================================
//  PART 2 — REACT CONTEXT
// ============================================================================

/**
 * ─── LAYER 1: CONSUMER COMPONENT WITH AN INLINE PROVIDER ─────────────────────
 *
 *   The simplest pattern: wrap the consumer in <Context.Provider value=…>
 *   with a controlled value. No state, no provider component, just hardcoded
 *   context data.
 *
 *   For the jest.mock-the-hook alternative, see ContextJestMock.test.jsx.
 */
describe("LAYER 1 — ThemedButton with inline ThemeContext.Provider", () => {
  test("reads theme from context and applies the className", () => {
    render(
      <ThemeContext.Provider value={{ theme: "dark", toggle: () => {} }}>
        <ThemedButton>Click me</ThemedButton>
      </ThemeContext.Provider>,
    );

    expect(screen.getByRole("button")).toHaveClass("btn-dark");
    expect(screen.getByRole("button")).toHaveTextContent(/dark/);
  });

  test("RTL's `wrapper` option is the cleanest way to wrap multiple tests", () => {
    const Wrapper = ({ children }) => (
      <ThemeContext.Provider value={{ theme: "light", toggle: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );

    render(<ThemedButton>Hi</ThemedButton>, { wrapper: Wrapper });

    expect(screen.getByRole("button")).toHaveClass("btn-light");
  });
});

/**
 * ─── LAYER 2: PROVIDER WITH INTERNAL STATE ──────────────────────────────────
 *
 *   When the Provider owns state (useState / useReducer / useEffect), render
 *   the REAL Provider in the test. This exercises the full provider logic
 *   end-to-end: useState updates, the toggle callback, propagation to
 *   consumers, etc.
 */
describe("LAYER 2 — ThemeProvider with internal state", () => {
  test("toggle switches the theme on click", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider initialTheme="light">
        <ThemedButton>Toggle</ThemedButton>
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-light");

    await user.click(button);

    expect(button).toHaveClass("btn-dark");
    expect(button).not.toHaveClass("btn-light");
  });

  test("initialTheme prop seeds the state correctly", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemedButton>X</ThemedButton>
      </ThemeProvider>,
    );

    expect(screen.getByRole("button")).toHaveClass("btn-dark");
  });

  test("useTheme throws a helpful error if used outside a Provider", () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    function Naked() {
      useTheme();
      return null;
    }

    expect(() => render(<Naked />)).toThrow(
      /useTheme must be used within a <ThemeProvider>/,
    );

    errSpy.mockRestore();
  });
});

/**
 * ─── LAYER 3: BOTH PROVIDERS COMBINED VIA renderWithProviders ───────────────
 */
describe("LAYER 3 — combined providers via renderWithProviders", () => {
  test("Counter still works AND ThemedButton sees the theme override", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(
      <>
        <Counter />
        <ThemedButton>Toggle Theme</ThemedButton>
      </>,
      {
        preloadedState: { counter: { value: 100, status: "idle", error: null } },
        theme: "dark",
      },
    );

    expect(screen.getByText(/Count: 100/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(store.getState().counter.value).toBe(101);

    expect(screen.getByRole("button", { name: /toggle theme/i })).toHaveClass(
      "btn-dark",
    );
  });
});

/**
 * ─── INTERVIEW-READY CHEAT SHEET ────────────────────────────────────────────
 *
 *   Redux Toolkit:
 *     • Reducer test  → call counterReducer(state, action) directly  (THIS FILE)
 *     • Thunk test    → MSW or jest.mock                              (companion files)
 *     • Component test → renderWithProviders + preloadedState         (THIS FILE)
 *     • Anti-pattern  → redux-mock-store (use real stores)
 *
 *   React Context:
 *     • Consumer test → wrap in <Context.Provider value={…}>          (THIS FILE)
 *     • Provider test → render the real <MyProvider> with a Consumer  (THIS FILE)
 *     • Multi-provider → renderWithProviders with RTL's `wrapper`     (THIS FILE)
 *     • Deeply nested → jest.mock the hook                            (companion: ContextJestMock)
 *
 *   Both:
 *     • Always assert on the DOM (what the user sees), often plus the store
 *       (so you catch stale-selector bugs)
 *     • findBy* for async state updates (thunks, useEffect-triggered fetches)
 *     • beforeEach is unnecessary if each test creates its own store/provider
 */
