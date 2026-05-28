/**
 * ============================================================================
 *  PartialMock.test.jsx — Teaching file for STEP 4: partial module mocking
 * ============================================================================
 *
 * Companion to MyUser.test.jsx. While MyUser.test.jsx demonstrates Steps 1–3
 * (full module mocking), THIS file demonstrates Step 4 — keeping some exports
 * REAL while replacing others.
 *
 * Why a separate file?
 *   jest.mock is FILE-SCOPED. Once declared at the top of a test file, every
 *   test in that file shares the same mock for that module. So to compare
 *   "full mock" vs "partial mock" of a module, you need TWO files.
 *
 * ─── THE PROBLEM PARTIAL MOCKING SOLVES ─────────────────────────────────────
 *
 *   Real-world modules often mix:
 *     • PURE helpers       (no side effects, deterministic, safe to test)
 *     • SIDE-EFFECTING fns (clock, I/O, console, network, randomness)
 *
 *   Look at src/utils/formatters.js:
 *     • formatUserName(user)     ← PURE — same input always gives same output
 *     • getCurrentTimestamp()    ← SIDE EFFECT — reads the system clock
 *     • logUserAction(...)       ← SIDE EFFECT — writes to console
 *
 *   If we full-mock this module with `jest.mock("../utils/formatters")`,
 *   formatUserName becomes jest.fn() returning `undefined` — and we'd have to
 *   manually re-implement it in each test. That's tedious and error-prone.
 *
 *   Partial mocking lets us say:
 *     "Keep formatUserName REAL, only replace the side-effecting functions."
 *
 * ─── HOW PARTIAL MOCKING WORKS ──────────────────────────────────────────────
 *
 *   The pattern uses a FACTORY (second arg to jest.mock) + jest.requireActual:
 *
 *     jest.mock("../utils/formatters", () => {
 *       const actual = jest.requireActual("../utils/formatters");
 *       return {
 *         ...actual,                          // keep ALL real exports
 *         getCurrentTimestamp: jest.fn(),     // OVERRIDE this one
 *         logUserAction: jest.fn(),           // OVERRIDE this one
 *       };
 *     });
 *
 *   jest.requireActual("path") = "give me the REAL module, bypassing all mocks"
 *
 *   The spread (...actual) copies every real export. Then the lines below
 *   override only what we want to mock. The pure formatUserName stays real.
 *
 * ─── INTERVIEW-GRADE GOTCHA: THE "mock" PREFIX RULE ─────────────────────────
 *
 *   jest.mock() is HOISTED to the top of the file, ABOVE all imports and
 *   any top-level variable declarations. So this CRASHES:
 *
 *     const fakeTime = 12345;
 *     jest.mock("../utils/formatters", () => ({
 *       getCurrentTimestamp: () => fakeTime,   // ❌ ReferenceError at hoist time
 *     }));
 *
 *   At hoist time, `fakeTime` doesn't exist yet — it's in the Temporal Dead Zone.
 *
 *   The escape hatch: Jest allows variables prefixed with "mock" (case-insensitive)
 *   inside the factory. So this WORKS:
 *
 *     const mockTimestamp = 12345;
 *     jest.mock("../utils/formatters", () => ({
 *       getCurrentTimestamp: () => mockTimestamp,   // ✅ allowed
 *     }));
 *
 *   The example below uses this pattern.
 */

import {
  formatUserName,
  getCurrentTimestamp,
  logUserAction,
} from "../utils/formatters";

// ─── Variables prefixed with "mock" are allowed inside the factory ────────
const mockTimestamp = 1700000000000;

// ─── STEP 4 IN ACTION — partial mock with jest.requireActual ──────────────
jest.mock("../utils/formatters", () => {
  // Pull in the REAL module — bypassing the mock we're currently defining.
  const actual = jest.requireActual("../utils/formatters");

  return {
    ...actual, // keep formatUserName (pure) REAL
    getCurrentTimestamp: jest.fn(() => mockTimestamp), // override (side effect)
    logUserAction: jest.fn(), // override (side effect)
  };
});

describe("STEP 4 — partial module mocking", () => {
  beforeEach(() => {
    getCurrentTimestamp.mockClear();
    logUserAction.mockClear();
  });

  // ─── formatUserName is REAL — runs the actual logic ─────────────────────
  describe("kept-real export — formatUserName (pure)", () => {
    test("capitalizes each name part using the REAL implementation", () => {
      // If this were a full mock, formatUserName would be jest.fn()
      // returning undefined. The partial mock keeps it real.
      expect(formatUserName({ name: "mohit sharma" })).toBe("Mohit Sharma");
      expect(formatUserName({ name: "BRETT lee" })).toBe("Brett Lee");
    });

    test("returns 'Unknown User' for invalid input — real logic preserved", () => {
      expect(formatUserName(null)).toBe("Unknown User");
      expect(formatUserName({})).toBe("Unknown User");
    });

    test("is the REAL function, not a jest.fn()", () => {
      // formatUserName has no mock methods because it's the real export.
      expect(formatUserName.mock).toBeUndefined();
    });
  });

  // ─── getCurrentTimestamp is MOCKED — returns our fixed value ────────────
  describe("overridden export — getCurrentTimestamp (side effect)", () => {
    test("returns the mocked timestamp instead of real Date.now()", () => {
      // Without the partial mock, this would change on every call. With
      // the mock, it's deterministic.
      expect(getCurrentTimestamp()).toBe(mockTimestamp);
      expect(getCurrentTimestamp()).toBe(mockTimestamp);
    });

    test("is a jest.fn() — we can spy on it", () => {
      getCurrentTimestamp();
      getCurrentTimestamp();
      expect(getCurrentTimestamp).toHaveBeenCalledTimes(2);
    });

    test("can be re-implemented per test with mockImplementationOnce", () => {
      getCurrentTimestamp.mockImplementationOnce(() => 9999);
      expect(getCurrentTimestamp()).toBe(9999); // first call uses override
      expect(getCurrentTimestamp()).toBe(mockTimestamp); // back to default
    });
  });

  // ─── logUserAction is MOCKED — we can assert it was called ──────────────
  describe("overridden export — logUserAction (side effect)", () => {
    test("can be called without polluting the test output", () => {
      logUserAction("login", { name: "mohit" });
      logUserAction("logout", { name: "mohit" });

      // It's a jest.fn() — we can assert how it was called.
      expect(logUserAction).toHaveBeenCalledTimes(2);
      expect(logUserAction).toHaveBeenNthCalledWith(1, "login", {
        name: "mohit",
      });
      expect(logUserAction).toHaveBeenNthCalledWith(2, "logout", {
        name: "mohit",
      });
    });

    test("does NOT actually call console.log (the side effect is skipped)", () => {
      // Spy on console.log to PROVE logUserAction's body never ran.
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      logUserAction("test", { name: "anyone" });

      // Mock replaced the implementation — real console.log was never invoked.
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

/**
 * ─── COMPANION CONCEPT — jest.spyOn vs jest.mock ────────────────────────────
 *
 *   When to use which:
 *
 *   ┌─────────────────────────┬─────────────────────────────────────────────┐
 *   │  jest.mock              │  jest.spyOn                                  │
 *   ├─────────────────────────┼─────────────────────────────────────────────┤
 *   │  Mocks a WHOLE module   │  Spies on ONE method of an OBJECT            │
 *   │  Hoisted to top         │  Called INSIDE a test                        │
 *   │  Wholesale replacement  │  Wraps the real method (can still call it)   │
 *   │  Used for your modules  │  Used for globals (console, Math.random),    │
 *   │                         │  third-party objects, or specific methods    │
 *   └─────────────────────────┴─────────────────────────────────────────────┘
 *
 *   The console.log spy in the last test above is the canonical spyOn use case:
 *
 *     const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
 *     // ... do stuff that may or may not log ...
 *     expect(consoleSpy).toHaveBeenCalled();
 *     consoleSpy.mockRestore();   // ← ALWAYS restore spies (no global pollution)
 *
 *   With spyOn you wrap an existing method; the ORIGINAL is restored when you
 *   call .mockRestore(). With jest.mock the module stays mocked for the whole
 *   test file — no restore method exists.
 */
