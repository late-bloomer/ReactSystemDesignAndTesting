/**
 * ============================================================================
 *  SpyOn.test.jsx — Teaching file for jest.spyOn patterns
 * ============================================================================
 *
 * Companion to MyUser.test.jsx (jest.mock) and PartialMock.test.jsx
 * (jest.requireActual). This file focuses on jest.spyOn — the third tool
 * in the mocking trinity.
 *
 * ─── WHEN TO USE jest.spyOn vs jest.mock vs jest.fn ─────────────────────────
 *
 *   jest.mock("path")          → replace an ENTIRE module at file scope
 *   jest.spyOn(obj, "method")  → wrap ONE method of an existing object
 *   jest.fn()                  → create a brand-new mock function
 *
 *   spyOn is the right tool when you want to:
 *     • Observe a call to a global (console, Math.random, Date.now)
 *     • Mock localStorage / sessionStorage
 *     • Spy on one method of a third-party SDK without mocking the whole thing
 *     • Watch a method but keep its REAL behavior running
 *
 * ─── THE DEFAULT BEHAVIOR ───────────────────────────────────────────────────
 *
 *   By default, jest.spyOn WRAPS the real method — calls go through and the
 *   real function still runs. You only get arg/call recording. To replace
 *   behavior, chain .mockImplementation/.mockReturnValue/.mockResolvedValue.
 *
 * ─── ALWAYS RESTORE SPIES ───────────────────────────────────────────────────
 *
 *   spy.mockRestore()           → restore one spy
 *   jest.restoreAllMocks()      → restore all spies (use in afterEach)
 *   restoreMocks: true in config → auto-restore between tests
 *
 *   Without restoring, spies leak across tests — and a silenced console.error
 *   in one test can hide real React warnings in the next.
 */

// Auto-restore spies after each test so we don't have to call .mockRestore()
// manually in every single test below. This is the cleanest cleanup pattern.
afterEach(() => {
  jest.restoreAllMocks();
});

// ─── #1: SPYING ON console METHODS ────────────────────────────────────────
describe("#1 — spy on console.error / console.warn / console.log", () => {
  test("records calls to console.error AND silences the output", () => {
    // .mockImplementation(() => {}) replaces the body so nothing actually logs.
    // Without it, console.error would still pollute the test output.
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    console.error("boom", new Error("offline"));

    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledWith(
      "boom",
      expect.objectContaining({ message: "offline" }),
    );
  });

  test("can spy WITHOUT silencing (the real log still runs)", () => {
    // No .mockImplementation — the real console.error runs.
    // Useful when you want to assert AND keep the log visible.
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // ↑ kept silenced here just to avoid noisy output in this test runner.
    // In a real project you'd usually drop the .mockImplementation if you
    // wanted the log preserved.

    console.error("real-ish error");
    expect(errSpy).toHaveBeenCalled();
  });
});

// ─── #2: SPYING ON Math.random ─────────────────────────────────────────────
describe("#2 — spy on Math.random (deterministic 'randomness')", () => {
  function pickElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  test("force Math.random to return a fixed value for predictable picks", () => {
    const randSpy = jest.spyOn(Math, "random").mockReturnValue(0); // → first element

    expect(pickElement(["a", "b", "c"])).toBe("a");
    expect(randSpy).toHaveBeenCalledTimes(1);
  });

  test("queue different random values per call with mockReturnValueOnce", () => {
    // 0.1 → index 0, 0.5 → index 1, 0.9 → index 2  (for length 3)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    expect(pickElement(["a", "b", "c"])).toBe("a");
    expect(pickElement(["a", "b", "c"])).toBe("b");
    expect(pickElement(["a", "b", "c"])).toBe("c");
  });
});

// ─── #3: SPYING ON Date.now ────────────────────────────────────────────────
describe("#3 — spy on Date.now (freeze the clock)", () => {
  function timestampedMessage(text) {
    return `[${Date.now()}] ${text}`;
  }

  test("forces Date.now to a fixed time", () => {
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);

    expect(timestampedMessage("hello")).toBe("[1700000000000] hello");
  });

  test("simulates time progressing across multiple calls", () => {
    jest.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(2000);

    expect(timestampedMessage("first")).toBe("[1000] first");
    expect(timestampedMessage("second")).toBe("[2000] second");
  });

  // Note: spyOn only overrides Date.now — not `new Date(...)`. For full
  // date control, use jest.useFakeTimers({ now: ... }) instead.
});

// ─── #4: SPYING ON localStorage / sessionStorage ───────────────────────────
describe("#4 — spy on Storage.prototype methods", () => {
  function saveAuthToken(token) {
    localStorage.setItem("authToken", token);
  }
  function readAuthToken() {
    return localStorage.getItem("authToken");
  }

  test("spy on setItem to assert what gets written", () => {
    // Spy on Storage.prototype so both localStorage AND sessionStorage are
    // covered by a single spy. localStorage.setItem == Storage.prototype.setItem.
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    saveAuthToken("abc123");

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith("authToken", "abc123");
  });

  test("spy on getItem and return a controlled value", () => {
    const getItemSpy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue("forced-token");

    expect(readAuthToken()).toBe("forced-token");
    expect(getItemSpy).toHaveBeenCalledWith("authToken");
  });
});

// ─── #5: SPY THAT PRESERVES REAL BEHAVIOR ──────────────────────────────────
describe("#5 — spy without overriding (observe, don't replace)", () => {
  const calculator = {
    add(a, b) {
      return a + b;
    },
  };

  test("spy without .mockImplementation — the real add still runs", () => {
    // No override → calls go through to the real implementation.
    const addSpy = jest.spyOn(calculator, "add");

    const result = calculator.add(2, 3);

    expect(result).toBe(5); // real behavior
    expect(addSpy).toHaveBeenCalledWith(2, 3); // arg recording
    expect(addSpy).toHaveReturnedWith(5); // return-value assertion
  });
});

// ─── #6: SPYING ON A PROPERTY GETTER (third arg) ───────────────────────────
describe("#6 — spy on a property getter with 'get' as the 3rd arg", () => {
  // Important: jest.spyOn with 'get'/'set' only works on properties that
  // are ACTUALLY defined with a getter/setter (via Object.defineProperty or
  // class get/set syntax). It does NOT work on plain data properties.
  //
  // window.innerWidth, for example, is a data property in jsdom — not a
  // getter — so spying on it as 'get' throws "Property does not have access
  // type get". To demo the pattern reliably, we define our own getter.

  const config = {};
  Object.defineProperty(config, "apiUrl", {
    get() {
      return "https://prod.example.com";
    },
    configurable: true, // ← REQUIRED for jest.spyOn to override the getter
  });

  test("override a custom-defined getter with 'get' as the 3rd arg", () => {
    expect(config.apiUrl).toBe("https://prod.example.com"); // real value

    jest
      .spyOn(config, "apiUrl", "get")
      .mockReturnValue("https://test.example.com");

    expect(config.apiUrl).toBe("https://test.example.com"); // overridden
  });

  test("spy on a setter the same way with 'set'", () => {
    const setterCalls = [];
    Object.defineProperty(config, "apiKey", {
      set(value) {
        setterCalls.push(value);
      },
      configurable: true,
    });

    const setSpy = jest.spyOn(config, "apiKey", "set");

    config.apiKey = "key-1";
    config.apiKey = "key-2";

    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenNthCalledWith(1, "key-1");
    expect(setSpy).toHaveBeenNthCalledWith(2, "key-2");
  });
});

// ─── #7: SPYING ON A NAMESPACE-IMPORTED MODULE EXPORT ──────────────────────
//
// KEY INTERVIEW GOTCHA:
// `import { fetchUsers } from "../api/userApi"` gives you a BINDING that
// jest.spyOn cannot override. To make spyOn work on a module export, you
// need to import the namespace: `import * as userApi from "../api/userApi"`.
// Then `userApi.fetchUsers` is a property you CAN spy on.
import * as userApi from "../api/userApi";

describe("#7 — spy on a module's named export via 'import * as'", () => {
  test("override userApi.fetchUsers without using jest.mock", async () => {
    const fetchSpy = jest
      .spyOn(userApi, "fetchUsers")
      .mockResolvedValue([{ id: 42, name: "spied user" }]);

    // Note we call userApi.fetchUsers, NOT a bare fetchUsers import.
    const data = await userApi.fetchUsers();

    expect(data).toEqual([{ id: 42, name: "spied user" }]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("after restoreAllMocks (in afterEach), the spy is GONE", async () => {
    // Previous test installed a spy on fetchUsers. afterEach above restored it.
    // Now userApi.fetchUsers is the real function again — which calls fetch().
    // Our MSW handler intercepts the real fetch and returns the default user list.
    const users = await userApi.fetchUsers();

    // From userHandlers.js default response
    expect(users).toEqual([
      { name: "bison johnson", id: 123 },
      { name: "brett lee", id: 124 },
    ]);
  });
});

// ─── #8: SPYING ON AN INSTANCE METHOD ──────────────────────────────────────
describe("#8 — spy on a method of an object/class instance", () => {
  class UserService {
    load() {
      return "real";
    }
  }

  test("can mock a single instance's method", () => {
    const service = new UserService();
    const loadSpy = jest.spyOn(service, "load").mockReturnValue("mocked");

    expect(service.load()).toBe("mocked");
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  test("instances created AFTER the spy are unaffected (it's per-instance)", () => {
    const a = new UserService();
    jest.spyOn(a, "load").mockReturnValue("mocked-a");

    const b = new UserService();
    // b was created AFTER a's spy, but the spy was on instance `a`, not on
    // the prototype. So b.load() runs the real method.
    expect(a.load()).toBe("mocked-a");
    expect(b.load()).toBe("real");
  });

  test("spy on the PROTOTYPE to affect ALL instances", () => {
    jest.spyOn(UserService.prototype, "load").mockReturnValue("proto-mocked");

    const a = new UserService();
    const b = new UserService();
    expect(a.load()).toBe("proto-mocked");
    expect(b.load()).toBe("proto-mocked");
  });
});

/**
 * ─── CHEAT SHEET ────────────────────────────────────────────────────────────
 *
 *   Spy creation:
 *     jest.spyOn(obj, "method")              → wrap real method (default)
 *     jest.spyOn(obj, "method").mockImpl(fn) → replace behavior
 *     jest.spyOn(obj, "prop", "get")         → spy on a getter
 *     jest.spyOn(obj, "prop", "set")         → spy on a setter
 *
 *   Spy assertions:
 *     expect(spy).toHaveBeenCalled()
 *     expect(spy).toHaveBeenCalledTimes(n)
 *     expect(spy).toHaveBeenCalledWith(arg, ...)
 *     expect(spy).toHaveReturnedWith(value)
 *
 *   Cleanup (pick ONE strategy and stick to it):
 *     spy.mockRestore()                      → per-spy, explicit
 *     jest.restoreAllMocks() in afterEach    → all spies, cleanest
 *     restoreMocks: true in jest config      → automatic, project-wide
 *
 *   Common pitfalls:
 *     • Forgetting to restore → React warnings get silenced silently
 *     • `import { x }` instead of `import * as namespace` → spyOn can't override
 *     • Spying on the wrong target (instance vs prototype)
 */
