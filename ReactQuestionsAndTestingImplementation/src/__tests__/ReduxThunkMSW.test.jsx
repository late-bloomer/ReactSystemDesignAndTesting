/**
 * ============================================================================
 *  ReduxThunkMSW.test.jsx — Thunk tests using MSW (network-layer mocking)
 * ============================================================================
 *
 * Companion file:
 *   • ReduxThunkJestMock.test.jsx — same thunk tested via jest.mock(global.fetch)
 *
 * Read both side-by-side to compare network-layer mocking (MSW) vs
 * module-layer mocking (jest.mock) for the same scenarios.
 *
 * ─── WHY MSW FOR THUNKS ─────────────────────────────────────────────────────
 *
 *   The thunk uses fetch under the hood. MSW intercepts at the network layer,
 *   so the thunk runs the REAL fetch / Response / json() pipeline — only the
 *   server response is faked. Catches more integration bugs than module-level
 *   stubs.
 *
 *   PATTERN: real configureStore + MSW handler (default or per-test override) +
 *            dispatch the thunk + assert state via store.getState().
 *
 * ─── WHEN TO PREFER MSW OVER jest.mock ──────────────────────────────────────
 *
 *   • You care about real HTTP semantics (status codes, headers, status.ok)
 *   • The same endpoint mock is reused across MANY tests
 *   • You want the same mock to power Storybook / Cypress / Playwright
 *   • You want to verify request body shape via `await request.json()`
 *
 *   When jest.mock would be cleaner: see ReduxThunkJestMock.test.jsx
 */

import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import counterReducer, { fetchInitialCount } from "../store/counterSlice";
import { Counter } from "../components/Counter";
import { renderWithProviders } from "../test-utils/renderWithProviders";
import { server } from "./mockServices/service";

// ─── PURE THUNK TESTS (no React) ────────────────────────────────────────────
describe("fetchInitialCount thunk — MSW-driven", () => {
  test("happy path: pending → fulfilled, state.value updated", async () => {
    // Default MSW handler (counterHandlers.js) returns { value: 42 }
    const store = configureStore({ reducer: { counter: counterReducer } });

    expect(store.getState().counter).toEqual({
      value: 0,
      status: "idle",
      error: null,
    });

    const action = await store.dispatch(fetchInitialCount());

    expect(action.type).toBe("counter/fetchInitialCount/fulfilled");
    expect(action.payload).toBe(42);
    expect(store.getState().counter).toEqual({
      value: 42,
      status: "succeeded",
      error: null,
    });
  });

  test("error path: server 500 → rejected, state.status = 'failed'", async () => {
    // Per-test override (Pattern 3 from MswOverride.test.jsx).
    // afterEach(server.resetHandlers) in jest.setup.js rolls this back.
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
    // jest.spyOn(store, "dispatch") does NOT see thunk lifecycle actions —
    // the thunk middleware dispatches internally before reaching the spy.
    // The canonical fix: a tiny recorder middleware in the chain.
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

    const types = recorded.map((a) => a?.type).filter(Boolean);
    expect(types).toEqual(
      expect.arrayContaining([
        "counter/fetchInitialCount/pending",
        "counter/fetchInitialCount/fulfilled",
      ]),
    );
  });
});

// ─── COMPONENT TEST THAT EXERCISES THE THUNK END-TO-END ─────────────────────
describe("Counter component — clicking triggers the thunk", () => {
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
