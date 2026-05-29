/**
 * ============================================================================
 *  MyUser.test.jsx — Teaching file for jest.mock patterns (GET/POST/PUT/DELETE)
 * ============================================================================
 *
 * This file is intentionally over-commented so you can read it as a reference.
 *
 * What it demonstrates:
 *   STEP 1: API logic extracted into a module (src/api/userApi.js)
 *   STEP 2: Basic jest.mock — replace the entire module with auto-mocks
 *   STEP 3: Per-test control (mockResolvedValue / mockResolvedValueOnce /
 *           mockRejectedValue / mockImplementation / mockReset)
 *   STEP 4: Partial mocking with jest.requireActual
 *           → DEMONSTRATED IN A SEPARATE FILE: PartialMock.test.jsx
 *             (because jest.mock is file-scoped — can't be both "full" and
 *              "partial" for the same module in the same file)
 *   INTERVIEW GOTCHA: jest.mock hoisting + the "mock" prefix rule
 *   PLUS: GET, POST, PUT, DELETE scenarios — happy path AND error path
 *
 * ─── BIG-PICTURE MENTAL MODEL ───────────────────────────────────────────────
 *
 *   "Where do you stub?" determines which tool you reach for:
 *
 *      [ Component ]
 *           ↓  imports
 *      [ userApi.fetchUsers() ]    ← jest.mock stubs HERE  (module layer)
 *           ↓  calls
 *      [ fetch("https://...") ]    ← MSW stubs HERE        (network layer)
 *           ↓  hits
 *      [ Real server / API ]
 *
 *   jest.mock = "stub at the module layer"   (faster, tighter coupling to code)
 *   MSW       = "stub at the network layer"  (slower, reflects real HTTP)
 *
 *   When you do `jest.mock("../api/userApi")`, the network layer is never reached
 *   — your mocked module returns whatever you tell it, BEFORE fetch is called.
 *
 * ─── STEP 1 — API CALLS EXTRACTED INTO A MODULE ────────────────────────────
 *
 *   Before extraction (HARD to test — fetch is inline in the component):
 *
 *      function MyUser() {
 *        useEffect(() => {
 *          fetch("/api/users").then(r => r.json()).then(setUsers);
 *        }, []);
 *      }
 *
 *   After extraction (EASY to mock — one named export per operation):
 *
 *      // src/api/userApi.js
 *      export async function fetchUsers() { ... }
 *      export async function createUser(user) { ... }
 *      export async function updateUser(id, user) { ... }
 *      export async function deleteUser(id) { ... }
 *
 *      // MyUser.jsx
 *      import { fetchUsers } from "../../api/userApi";
 *      useEffect(() => { fetchUsers().then(setUsers); }, []);
 *
 *   Why this matters for testing:
 *      • The test mocks ONE module (`../api/userApi`) instead of fighting with
 *        the global `fetch` API.
 *      • All HTTP shape lives in one place — change the endpoint URL and the
 *        component stays untouched.
 *      • Each export is a separate jest.fn() in the test — you can mock,
 *        spy on, and assert each one independently.
 *
 *   See: src/api/userApi.js for the full module.
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MyUser from "../components/ReactTesting/MyUser";

// ─── STEP 2 ─────────────────────────────────────────────────────────────────
// Mock the WHOLE userApi module. Every named export becomes a jest.fn().
//
// Important: this line is HOISTED to the top of the file (above all imports)
// by Jest's babel plugin. So even though it appears below the imports here,
// at runtime it executes FIRST — which is why the `fetchUsers` we import
// below is already the mocked version.
//
// We import the same names from the module so we can configure them per test.
import { fetchUsers, createUser, updateUser, deleteUser } from "../api/userApi";

jest.mock("../api/userApi");

/**
 * ─── STEP 3 — MOCK CONTROL REFERENCE TABLE ──────────────────────────────────
 *
 *   ┌──────────────────────────────────┬─────────────────────────────────────┐
 *   │  Method                          │  What it does                       │
 *   ├──────────────────────────────────┼─────────────────────────────────────┤
 *   │  fn.mockReturnValue(v)           │  Sync: returns v for every call     │
 *   │  fn.mockReturnValueOnce(v)       │  Sync: returns v for NEXT call only │
 *   │  fn.mockResolvedValue(v)         │  Async: resolves with v always      │
 *   │  fn.mockResolvedValueOnce(v)     │  Async: resolves with v NEXT call   │
 *   │  fn.mockRejectedValue(err)       │  Async: rejects with err always     │
 *   │  fn.mockRejectedValueOnce(err)   │  Async: rejects with err NEXT call  │
 *   │  fn.mockImplementation(fn)       │  Replace impl entirely (args→return)│
 *   │  fn.mockImplementationOnce(fn)   │  Replace impl for NEXT call only    │
 *   ├──────────────────────────────────┼─────────────────────────────────────┤
 *   │  fn.mockReset()                  │  Clear calls AND implementations    │
 *   │  fn.mockClear()                  │  Clear calls, KEEP implementations  │
 *   │  fn.mockRestore()                │  Only for jest.spyOn — restore real │
 *   ├──────────────────────────────────┼─────────────────────────────────────┤
 *   │  Assertions on calls                                                    │
 *   ├──────────────────────────────────┴─────────────────────────────────────┤
 *   │  expect(fn).toHaveBeenCalled()                                          │
 *   │  expect(fn).toHaveBeenCalledTimes(n)                                    │
 *   │  expect(fn).toHaveBeenCalledWith(arg1, arg2, ...)                       │
 *   │  expect(fn).toHaveBeenNthCalledWith(n, arg1, arg2, ...)                 │
 *   │  expect(fn).not.toHaveBeenCalled()                                      │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 *   Choosing between variants:
 *     • Same response every call?         → mockResolvedValue
 *     • Different response per call?      → mockResolvedValueOnce (queue)
 *     • Compute response from arguments?  → mockImplementation
 *     • Reset between tests?              → mockReset in beforeEach
 *
 *   Why mockReset (not mockClear) in beforeEach:
 *     mockReset wipes implementations too, so one test's setup can't leak
 *     into the next. Use mockClear only if you want to keep a global default.
 */

// ─── Helper: default happy-path mocks shared across most tests ─────────────
const mockUsers = [
  { id: 1, name: "alice" },
  { id: 2, name: "bob" },
];

beforeEach(() => {
  // mockReset() wipes both calls AND implementations between tests.
  // Use mockClear() if you want to keep implementations but clear calls.
  fetchUsers.mockReset();
  createUser.mockReset();
  updateUser.mockReset();
  deleteUser.mockReset();

  // Default happy path — individual tests can override.
  fetchUsers.mockResolvedValue(mockUsers);
});

// ─── GET ────────────────────────────────────────────────────────────────────
describe("GET — fetchUsers on mount", () => {
  test("renders the user list returned by the API", async () => {
    render(<MyUser name="mohit" printUser={jest.fn()} />);

    // findBy* polls until the element appears. Component fetches on mount
    // via useEffect → fetchUsers resolves → setUserList → DOM updates.
    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  test("calls fetchUsers exactly once on mount", async () => {
    render(<MyUser name="mohit" printUser={jest.fn()} />);

    // IMPORTANT: wait for the rendered RESULT of the fetch, not just the call.
    // Waiting only on `expect(fetchUsers).toHaveBeenCalled()` returns the moment
    // the function is invoked — but `.then(setUserList)` may still be pending,
    // and that pending state update fires AFTER the test ends → act() warning.
    await screen.findByText("alice");

    expect(fetchUsers).toHaveBeenCalledTimes(1);
    expect(fetchUsers).toHaveBeenCalledWith();
  });

  test("shows error status when fetchUsers rejects", async () => {
    // STEP 3 — mockRejectedValueOnce: only this test sees the rejection.
    fetchUsers.mockRejectedValueOnce(new Error("network down"));

    render(<MyUser name="mohit" printUser={jest.fn()} />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /load failed: network down/i,
    );

    // ─── PROOF the rejection path actually executed ─────────────────────────
    // Without this, the negative assertions below would pass even if the
    // component never called fetchUsers at all (e.g. a refactor removed the
    // useEffect). This is the assertion that locks in "the path ran".
    expect(fetchUsers).toHaveBeenCalledTimes(1);

    // ─── NEGATIVE ASSERTIONS (Pattern #2: state didn't change) ──────────────
    // Now we can claim "the rejection had no effect on state" — because we
    // already proved the rejection ran.
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByText("alice")).not.toBeInTheDocument();
    expect(screen.queryByText("bob")).not.toBeInTheDocument();
  });
});

// ─── POST ───────────────────────────────────────────────────────────────────
describe("POST — createUser", () => {
  test("calls createUser with the new user and appends to the list", async () => {
    const user = userEvent.setup();
    // STEP 3 — mockResolvedValue: same return for every call to createUser.
    createUser.mockResolvedValue({ id: 999, name: "new user" });

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    // Wait for the GET to finish so the list is rendered first.
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /create user/i }));

    // STEP 3 — assert arguments to the mock.
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith({ name: "new user" });

    // New user appears in the rendered list.
    expect(await screen.findByText("new user")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/created id 999/i);
  });

  test("shows error status when createUser rejects", async () => {
    const user = userEvent.setup();
    createUser.mockRejectedValue(new Error("conflict"));

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /create failed: conflict/i,
    );

    // ─── PROOF the rejection path executed ──────────────────────────────────
    // Without these, the "length === 2" negative assertion would also pass
    // if the click handler was missing entirely (no createUser call → list
    // simply stays at its initial 2 items).
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith({ name: "new user" });

    // ─── NEGATIVE ASSERTIONS (Pattern #2: list unchanged) ───────────────────
    // Now "length === 2" is meaningful: the click DID call createUser, the
    // rejection WAS caught, and the catch block did NOT append.
    expect(screen.queryByText("new user")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

// ─── PUT ────────────────────────────────────────────────────────────────────
describe("PUT — updateUser", () => {
  test("calls updateUser with id + payload and replaces user in the list", async () => {
    const user = userEvent.setup();
    updateUser.mockResolvedValue({ id: 1, name: "alice (updated)" });

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /update user/i }));

    // Two-arg call: id and the payload.
    expect(updateUser).toHaveBeenCalledWith(1, { name: "updated user" });

    expect(await screen.findByText("alice (updated)")).toBeInTheDocument();
    // The old "alice" should be gone (replaced, not appended).
    expect(screen.queryByText("alice")).not.toBeInTheDocument();
  });

  test("shows error status when updateUser rejects (list unchanged)", async () => {
    const user = userEvent.setup();
    updateUser.mockRejectedValue(new Error("not found"));

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /update user/i }));

    // Error UI surfaced
    expect(await screen.findByRole("status")).toHaveTextContent(
      /update failed: not found/i,
    );

    // ─── PROOF the rejection path executed ──────────────────────────────────
    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith(1, { name: "updated user" });

    // ─── NEGATIVE ASSERTIONS — original "alice" is still there ─────────────
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.queryByText("alice (updated)")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("does nothing if the list is empty (button does not trigger updateUser)", async () => {
    const user = userEvent.setup();
    // Override the default: GET returns an empty list this time.
    fetchUsers.mockResolvedValue([]);

    render(<MyUser name="mohit" printUser={jest.fn()} />);

    // Empty list means nothing visible to wait for — so wait for the call AND
    // flush the .then microtask via act(). Without this, setUserList([]) can
    // fire after the test ends → act() warning.
    await waitFor(() => expect(fetchUsers).toHaveBeenCalledTimes(1));
    await act(async () => {});

    await user.click(screen.getByRole("button", { name: /update user/i }));

    expect(updateUser).not.toHaveBeenCalled();
  });
});

// ─── DELETE ─────────────────────────────────────────────────────────────────
describe("DELETE — deleteUser", () => {
  test("calls deleteUser with the id and removes user from the list", async () => {
    const user = userEvent.setup();
    deleteUser.mockResolvedValue({ id: 1 });

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /delete user/i }));

    expect(deleteUser).toHaveBeenCalledWith(1);

    await waitFor(() =>
      expect(screen.queryByText("alice")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/deleted id 1/i);
  });

  test("shows error status when deleteUser rejects (list unchanged)", async () => {
    const user = userEvent.setup();
    deleteUser.mockRejectedValue(new Error("forbidden"));

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /delete user/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /delete failed: forbidden/i,
    );

    // ─── PROOF the rejection path executed ──────────────────────────────────
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith(1);

    // ─── NEGATIVE ASSERTIONS — both users still present ────────────────────
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

// ─── STEP 3 (deeper) — different return per call ────────────────────────────
describe("STEP 3 — mockResolvedValueOnce queue + mockImplementation", () => {
  test("mockResolvedValueOnce queues different responses per call", async () => {
    // Each .Once entry is consumed in order. After they run out, the
    // base mockResolvedValue takes over (here, the empty default).
    fetchUsers
      .mockResolvedValueOnce([{ id: 10, name: "first call user" }])
      .mockResolvedValueOnce([{ id: 20, name: "second call user" }]);

    // Component only calls fetchUsers once on mount, so we only see "first".
    render(<MyUser name="mohit" printUser={jest.fn()} />);

    expect(await screen.findByText("first call user")).toBeInTheDocument();
  });

  test("mockImplementation lets you compute the return from arguments", async () => {
    const user = userEvent.setup();

    // The PUT handler now varies its response based on the input id.
    // Useful when a fixed mockResolvedValue isn't expressive enough.
    updateUser.mockImplementation((id, payload) =>
      Promise.resolve({ id, name: `${payload.name} — id=${id}` }),
    );

    render(<MyUser name="mohit" printUser={jest.fn()} />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: /update user/i }));

    expect(await screen.findByText("updated user — id=1")).toBeInTheDocument();
  });
});

// ─── INTERVIEW GOTCHA — jest.mock hoisting & the "mock" prefix rule ─────────
//
// jest.mock() is HOISTED to the top of the file, ABOVE all your imports and
// any top-level variable declarations. So this naive pattern crashes:
//
//   const fakeUsers = [{ id: 1 }];
//   jest.mock("../api/userApi", () => ({
//     fetchUsers: () => Promise.resolve(fakeUsers),  // ❌ ReferenceError
//   }));
//
// At hoist time, `fakeUsers` doesn't exist yet — it's TDZ'd.
//
// Jest gives you an escape hatch: variables whose name starts with `mock`
// (case-insensitive) are allowed inside the factory. This works:
//
//   const mockUsers = [{ id: 1 }];
//   jest.mock("../api/userApi", () => ({
//     fetchUsers: () => Promise.resolve(mockUsers),  // ✅ allowed
//   }));
//
// See the "STEP 4" block below for a complete working example.

// ─── STEP 4 — partial mocking with jest.requireActual ──────────────────────
//
// → SEE: src/__tests__/PartialMock.test.jsx for a complete WORKING example.
//
// The short version:
//   Sometimes you want to keep MOST of a module real and only swap out one
//   function. Example: a formatters.js that exports both formatUserName
//   (pure logic — leave it real) and logUserAction (side effect — mock it).
//
//   jest.mock("../utils/formatters", () => {
//     const actual = jest.requireActual("../utils/formatters");
//     return {
//       ...actual,                  // keep the real exports
//       logUserAction: jest.fn(),   // override only the side-effecting one
//     };
//   });
//
// Why it's in a SEPARATE file:
//   jest.mock is FILE-SCOPED. Once you've declared `jest.mock("../api/userApi")`
//   at the top of THIS file, every test in this file gets the FULL mock.
//   To demonstrate partial mocking, you need a different file (or a different
//   module). The cleanest way is one file per mocking strategy.
//
// When this pattern is the right choice:
//   • A module mixes pure helpers + side-effecting functions
//   • You only want to mock the side-effecting parts
//   • The pure helpers add value to your test (you don't want to re-implement
//     them in the mock factory)

// ─── Bonus: jest.spyOn alternative ─────────────────────────────────────────
//
// If you want to mock just ONE method on an OBJECT (not a module), spyOn is
// more targeted than jest.mock. Example: spying on console.error to assert
// it was called, while keeping the rest of console intact:
//
//   const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
//   // ... test
//   expect(errSpy).toHaveBeenCalledWith(...);
//   errSpy.mockRestore();
//
// Use `jest.spyOn` for objects + methods. Use `jest.mock` for whole modules.
