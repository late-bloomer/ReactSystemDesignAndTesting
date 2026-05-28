/**
 * ============================================================================
 *  ReduxAndContext.test.jsx — Teaching file for Redux Toolkit + React Context
 * ============================================================================
 *
 * This file walks through the three-layered approach to testing connected
 * components and the parallel patterns for React Context.
 *
 * Project files this test exercises:
 *   • src/store/counterSlice.js       (slice + thunk + selectors)
 *   • src/store/store.js              (production store config)
 *   • src/components/Counter.jsx      (connected component)
 *   • src/contexts/ThemeContext.jsx   (context + provider + hook)
 *   • src/components/ThemedButton.jsx (context consumer)
 *   • src/test-utils/renderWithProviders.jsx
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
 *   Both can be tested in three layers, in increasing complexity:
 *     1. PURE LOGIC      → reducer / selector / pure utility (no React)
 *     2. STATE LIFECYCLE → thunk / provider state transitions
 *     3. INTEGRATION     → component connected to the provider
 */

import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import counterReducer, {
  increment,
  decrement,
  addBy,
  reset,
  fetchInitialCount,
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
import { server } from "./mockServices/service";

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
    // Passing undefined triggers the slice's default initialState.
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
 * ─── LAYER 2: ASYNC THUNK TESTS ──────────────────────────────────────────────
 *
 *   Async thunks need a store to dispatch into (and to read the resulting
 *   state from). MSW intercepts the network call so the thunk behaves like
 *   it would in production — no fake fetch.
 *
 *   PATTERN: real configureStore + MSW network mock + dispatch the thunk +
 *            assert state via store.getState() AND/OR action sequence.
 */
describe("LAYER 2 — fetchInitialCount thunk", () => {
  test("happy path: pending → fulfilled, state.value updated", async () => {
    // Fresh store per test to avoid cross-test pollution.
    const store = configureStore({ reducer: { counter: counterReducer } });

    expect(store.getState().counter).toEqual({
      value: 0,
      status: "idle",
      error: null,
    });

    // Dispatch the thunk and await its result.
    const action = await store.dispatch(fetchInitialCount());

    // MSW handler in counterHandlers.js returns { value: 42 }.
    expect(action.type).toBe("counter/fetchInitialCount/fulfilled");
    expect(action.payload).toBe(42);

    // Assert the resulting state.
    expect(store.getState().counter).toEqual({
      value: 42,
      status: "succeeded",
      error: null,
    });
  });

  test("error path: server 500 → rejected, state.status = 'failed'", async () => {
    // Pattern 3 from MswOverride.test.jsx — override JUST for this test.
    server.use(
      http.get(
        "https://jsonplaceholder.typicode.com/count",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const store = configureStore({ reducer: { counter: counterReducer } });
    const action = await store.dispatch(fetchInitialCount());

    expect(action.type).toBe("counter/fetchInitialCount/rejected");
    expect(store.getState().counter.status).toBe("failed");
    expect(store.getState().counter.error).toMatch(/500/);
  });

  test("can also assert the dispatched action SEQUENCE via a recorder middleware", async () => {
    // jest.spyOn(store, "dispatch") DOESN'T work for thunk lifecycle actions
    // because the thunk middleware intercepts and dispatches internal actions
    // through its own chain — they never hit the spied outer dispatch.
    //
    // The canonical fix: install a tiny middleware that records every action
    // that flows through the chain. This is also the underlying technique
    // redux-mock-store uses, but here we keep a real store.
    const recorded = [];
    const recorder = () => (next) => (action) => {
      recorded.push(action);
      return next(action);
    };

    const store = configureStore({
      reducer: { counter: counterReducer },
      middleware: (getDefault) => getDefault().concat(recorder),
    });

    await store.dispatch(fetchInitialCount());

    // recorded contains BOTH the thunk-fn and the lifecycle actions.
    // Action objects have a `.type` string; the thunk function does not.
    const types = recorded.map((a) => a?.type).filter(Boolean);
    expect(types).toEqual(
      expect.arrayContaining([
        "counter/fetchInitialCount/pending",
        "counter/fetchInitialCount/fulfilled",
      ]),
    );
  });
});

/**
 * ─── LAYER 3: CONNECTED COMPONENT TESTS ──────────────────────────────────────
 *
 *   Render a Counter inside a real <Provider store={…}>. Use
 *   renderWithProviders for the cleanest wrap.
 *
 *   `preloadedState` is the canonical way to "arrange" the initial state —
 *   cheaper and more declarative than dispatching N actions before the render.
 *
 *   ANTI-PATTERN: redux-mock-store. The Redux team itself recommends real
 *   stores because mocks miss middleware behavior, async thunk lifecycle,
 *   and selector composition.
 */
describe("LAYER 3 — Counter connected component", () => {
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

    // Assert via the DOM…
    expect(screen.getByText(/Count: 2/)).toBeInTheDocument();
    // …AND via the store. Both are valid; combining them catches a wider
    // set of bugs (e.g. a stale selector that doesn't subscribe).
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

  test("clicking 'load from API' dispatches the thunk and renders the result", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Counter />);

    await user.click(screen.getByRole("button", { name: /load from api/i }));

    // findByText waits for the async update — pending → succeeded → value=42.
    expect(await screen.findByText(/Count: 42/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("status: succeeded");
    expect(store.getState().counter.value).toBe(42);
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
 *   Best for testing consumers in isolation when you don't care about
 *   the Provider's internal logic.
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
    // The `wrapper` option avoids nesting JSX manually — especially useful
    // when you have several providers stacked.
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
 *
 *   The trick: include a small "TestConsumer" if you don't have a natural
 *   consumer that exposes the value through the DOM.
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

    await user.click(button); // invokes toggle() from context

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
    // Silence console.error so React's automatic error logging doesn't
    // pollute test output for this expected error case.
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    function Naked() {
      // Calling useTheme without a Provider throws — proves the guard works.
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
 *
 *   In a real app, components often need BOTH Redux + Context. The
 *   renderWithProviders helper hides the wrapping ceremony.
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

    // Redux part
    expect(screen.getByText(/Count: 100/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(store.getState().counter.value).toBe(101);

    // Context part
    expect(screen.getByRole("button", { name: /toggle theme/i })).toHaveClass(
      "btn-dark",
    );
  });
});

/**
 * ─── LAYER 4 (BONUS): MOCKING THE CONTEXT HOOK WITH jest.mock ───────────────
 *
 *   Sometimes the consumer is deeply nested and wiring up the full Provider
 *   in the test is overkill. jest.mock the custom hook directly.
 *
 *   Trade-off: less realistic than the Provider wrapper. Use sparingly —
 *   reach for the wrapper first.
 *
 *   Example (commented out — would require relocating to a separate file
 *   because jest.mock is file-scoped and we use the real hook elsewhere):
 *
 *     jest.mock("../contexts/ThemeContext", () => ({
 *       useTheme: () => ({ theme: "dark", toggle: jest.fn() }),
 *     }));
 *
 *     test("mocked hook short-circuits the Provider tree", () => {
 *       render(<ThemedButton>Hi</ThemedButton>);
 *       expect(screen.getByRole("button")).toHaveClass("btn-dark");
 *     });
 */

/**
 * ─── INTERVIEW-READY CHEAT SHEET ────────────────────────────────────────────
 *
 *   Redux Toolkit:
 *     • Reducer test  → call counterReducer(state, action) directly
 *     • Thunk test    → real configureStore + MSW + dispatch
 *     • Component test → renderWithProviders + preloadedState
 *     • Anti-pattern  → redux-mock-store (use real stores)
 *
 *   React Context:
 *     • Consumer test → wrap in <Context.Provider value={…}>
 *     • Provider test → render the real <MyProvider> with a TestConsumer
 *     • Multi-provider → renderWithProviders with RTL's `wrapper` option
 *     • Deeply nested → jest.mock the hook (last resort)
 *
 *   Both:
 *     • Always assert on the DOM (what the user sees), often plus the store
 *       (so you catch stale-selector bugs)
 *     • findBy* for async state updates (thunks, useEffect-triggered fetches)
 *     • beforeEach is unnecessary if each test creates its own store/provider
 */
