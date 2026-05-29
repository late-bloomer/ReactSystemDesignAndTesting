/**
 * ============================================================================
 *  ReduxThunkJestMock.test.jsx — testing Redux thunks WITHOUT MSW
 * ============================================================================
 *
 * Companion to ReduxAndContext.test.jsx — which uses MSW for the thunk's
 * network call. This file shows the SAME tests using jest.mock instead.
 *
 * Yes, jest.mock works perfectly for thunks. The choice between the two is
 * a trade-off, not a "right answer."
 *
 * ─── TWO COMMON jest.mock APPROACHES FOR THUNKS ─────────────────────────────
 *
 *   APPROACH A — mock global.fetch directly
 *     • Zero source-code changes
 *     • Coarse: ALL fetches in the test return your mock
 *     • Easy for one-off tests, less ideal at scale
 *
 *   APPROACH B — extract the network call into an api module, jest.mock it
 *     • Requires extracting `fetch(...)` into something like `counterApi.js`
 *     • Each function is independently mockable (cleaner per-test control)
 *     • Same pattern we use in MyUser.test.jsx for userApi
 *     • This is the production-grade default
 *
 *   THIS FILE demonstrates APPROACH A because our counterSlice currently
 *   inlines fetch. Approach B is shown in comments at the bottom.
 *
 * ─── jest.mock vs MSW — DECISION GUIDE ──────────────────────────────────────
 *
 *   Use jest.mock (this file) when:
 *     • You want SPEED — no network layer, just function stubs
 *     • You want to assert WHAT was called and HOW (jest.fn args/calls API)
 *     • You're testing one thunk in isolation
 *     • You don't care about real HTTP semantics (status codes, headers)
 *
 *   Use MSW (ReduxAndContext.test.jsx) when:
 *     • You want realistic HTTP behavior — real Response, real status codes
 *     • Multiple tests share the same endpoint mock
 *     • Same handler reusable in Storybook / Cypress / Playwright
 *     • You care about request body shape, headers, query params
 *
 *   Truth: both are valid, and many production projects use BOTH — jest.mock
 *   for tight unit tests, MSW for integration-style tests.
 */

import { configureStore } from "@reduxjs/toolkit";
import counterReducer, {
  fetchInitialCount,
} from "../store/counterSlice";

const COUNT_URL = "https://jsonplaceholder.typicode.com/count";

// ─── SETUP ──────────────────────────────────────────────────────────────────
// Replace global.fetch with a jest.fn() before each test. The MSW server
// (from jest.setup.js) is still running but will be bypassed entirely —
// because we're replacing fetch at the global level, MSW's interceptors
// never get to run for these tests.
beforeEach(() => {
  global.fetch = jest.fn();
});

// IMPORTANT: restore global.fetch after each test so OTHER test files
// (like MswOverride.test.jsx) get their real fetch + MSW interception back.
afterEach(() => {
  jest.restoreAllMocks();
  // restoreAllMocks doesn't reset our hard assignment to global.fetch —
  // it only restores spies created with jest.spyOn. So we manually clear:
  delete global.fetch;
});

describe("APPROACH A — mock global.fetch directly", () => {
  // ─── HAPPY PATH ──────────────────────────────────────────────────────────
  test("happy path: fetch resolves → thunk fulfilled → state updated", async () => {
    // Configure the mock for THIS test.
    // The thunk calls response.json() so we need that on the mock too.
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ value: 42 }),
    });

    const store = configureStore({ reducer: { counter: counterReducer } });

    const action = await store.dispatch(fetchInitialCount());

    // Lifecycle action assertions
    expect(action.type).toBe("counter/fetchInitialCount/fulfilled");
    expect(action.payload).toBe(42);

    // State assertion
    expect(store.getState().counter).toEqual({
      value: 42,
      status: "succeeded",
      error: null,
    });

    // PROOF the network layer was called with the right URL.
    // This is the killer feature of jest.fn() that MSW doesn't give you
    // for free — you get arg-recording out of the box.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(COUNT_URL);
  });

  // ─── ERROR PATH (server returned non-ok) ─────────────────────────────────
  test("error path: 500 response → thunk rejected → state.status = 'failed'", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const store = configureStore({ reducer: { counter: counterReducer } });

    const action = await store.dispatch(fetchInitialCount());

    expect(action.type).toBe("counter/fetchInitialCount/rejected");
    expect(store.getState().counter.status).toBe("failed");
    expect(store.getState().counter.error).toMatch(/500/);

    // Same arg-check as above.
    expect(global.fetch).toHaveBeenCalledWith(COUNT_URL);
  });

  // ─── NETWORK ERROR (fetch itself throws) ─────────────────────────────────
  test("network error: fetch rejects → thunk rejected → error captured", async () => {
    // mockRejectedValue makes the fetch() call itself throw, simulating
    // network failure (DNS, offline, etc) — distinct from a non-2xx response.
    global.fetch.mockRejectedValue(new Error("network unreachable"));

    const store = configureStore({ reducer: { counter: counterReducer } });

    const action = await store.dispatch(fetchInitialCount());

    expect(action.type).toBe("counter/fetchInitialCount/rejected");
    expect(store.getState().counter.status).toBe("failed");
    expect(store.getState().counter.error).toBe("network unreachable");
  });

  // ─── QUEUE DIFFERENT RESPONSES PER CALL ──────────────────────────────────
  test("mockResolvedValueOnce queues different responses for sequential calls", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: 100 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: 200 }) });

    const store = configureStore({ reducer: { counter: counterReducer } });

    await store.dispatch(fetchInitialCount());
    expect(store.getState().counter.value).toBe(100);

    await store.dispatch(fetchInitialCount());
    expect(store.getState().counter.value).toBe(200);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

/**
 * ─── APPROACH B — extract API module + jest.mock ────────────────────────────
 *
 * Cleaner production pattern. Requires extracting the inline fetch into
 * its own module:
 *
 *   // src/api/counterApi.js
 *   export async function fetchCount() {
 *     const response = await fetch("https://jsonplaceholder.typicode.com/count");
 *     if (!response.ok) throw new Error(`fetchCount failed: ${response.status}`);
 *     return response.json();
 *   }
 *
 *   // src/store/counterSlice.js — update the thunk to use it
 *   import { fetchCount } from "../api/counterApi";
 *
 *   export const fetchInitialCount = createAsyncThunk(
 *     "counter/fetchInitialCount",
 *     async () => {
 *       const data = await fetchCount();
 *       return data.value;
 *     },
 *   );
 *
 *   // src/__tests__/CounterThunk.test.jsx — mock the api module
 *   import { fetchCount } from "../api/counterApi";
 *   jest.mock("../api/counterApi");
 *
 *   beforeEach(() => fetchCount.mockReset());
 *
 *   test("happy path", async () => {
 *     fetchCount.mockResolvedValue({ value: 42 });
 *     const store = configureStore({ reducer: { counter: counterReducer } });
 *     await store.dispatch(fetchInitialCount());
 *     expect(store.getState().counter.value).toBe(42);
 *     expect(fetchCount).toHaveBeenCalledTimes(1);
 *   });
 *
 * Why this is better than Approach A:
 *   • No need to recreate the Response interface (`{ ok, json, status }`)
 *   • The mock signature exactly matches your code's contract
 *   • One module per resource — natural growth pattern
 *   • Compose: you can mock multiple endpoints with separate jest.fn()s
 *
 * This is the same pattern MyUser.test.jsx uses for userApi.fetchUsers /
 * createUser / updateUser / deleteUser. The interview-grade answer is:
 *   "I extract HTTP calls into an api module, then jest.mock the module."
 */

/**
 * ─── BOTH-VARIANTS SUMMARY ──────────────────────────────────────────────────
 *
 *   ┌──────────────────────┬─────────────────────┬─────────────────────────┐
 *   │                      │  MSW                │  jest.mock              │
 *   │                      │  (this dir's        │  (this file)            │
 *   │                      │   ReduxAndContext)  │                         │
 *   ├──────────────────────┼─────────────────────┼─────────────────────────┤
 *   │ Layer of stubbing    │ Network (HTTP)      │ Module / fetch function │
 *   │ Setup cost           │ Higher (server)     │ Lower (per test)        │
 *   │ Reusable handlers    │ ✅                  │ ❌ (per file)           │
 *   │ Storybook/Cypress    │ ✅ same handlers    │ ❌ Jest-only            │
 *   │ HTTP realism         │ ✅ real Response    │ ❌ fake object          │
 *   │ Arg assertions       │ via request.json()  │ ✅ direct on jest.fn()  │
 *   │ Test speed           │ Fast                │ Fastest                 │
 *   │ Best for             │ Integration tests   │ Unit tests              │
 *   └──────────────────────┴─────────────────────┴─────────────────────────┘
 *
 * Most production codebases use BOTH — jest.mock for component-level tests
 * where speed and arg-assertion matter, MSW for integration tests where
 * real HTTP behavior matters.
 */
