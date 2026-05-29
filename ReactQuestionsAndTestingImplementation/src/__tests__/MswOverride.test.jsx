/**
 * ============================================================================
 *  MswOverride.test.jsx — Teaching file for Pattern 3: per-test overrides
 * ============================================================================
 *
 * This file demonstrates how to override MSW handlers FOR A SINGLE TEST
 * without affecting the rest of the suite.
 *
 * ─── THE LAYERED MENTAL MODEL ───────────────────────────────────────────────
 *
 *   LAYER 1: DEFAULT HANDLERS    (mockServices/handlers/userHandlers.js)
 *     ↳ Happy path. 200 responses with the shape your component expects.
 *     ↳ Used by ALL tests by default. Define here things that 95% of tests want.
 *
 *   LAYER 2: PER-TEST OVERRIDES  (server.use(...) inside a test)
 *     ↳ Edge cases. 5xx errors, empty lists, slow responses, conflicts.
 *     ↳ Only affects the current test. Reset by `afterEach(server.resetHandlers)`.
 *
 *   The split lets your default handlers stay clean and focused on the common
 *   case, while exceptional scenarios are documented INSIDE the test that
 *   needs them — right next to the assertion they cause.
 *
 * ─── WHY THIS BEATS JEST.MOCK FOR THESE SCENARIOS ──────────────────────────
 *
 *   You COULD test the same error path by mocking `userApi.fetchUsers` to
 *   reject. But that mocks at the MODULE layer — your component's `fetch`
 *   call is bypassed entirely. With MSW you exercise the real fetch path,
 *   real Response, real status code, real json parsing. Catches real bugs.
 *
 *   Use jest.mock when you want SPEED + ARG ASSERTIONS.
 *   Use MSW + server.use when you want REALISTIC HTTP behaviour.
 *
 * ─── KEY MSW v2 PRIMITIVES YOU'LL USE ──────────────────────────────────────
 *
 *   server.use(...handlers)
 *     Adds (or overrides) handlers for the current test run. Last-registered
 *     handler wins, so server.use() entries always take precedence over the
 *     defaults you set up in setupServer(...).
 *
 *   server.resetHandlers()
 *     Wipes all server.use(...) overrides. Default handlers stay. This is
 *     called from `afterEach` in your jest.setup.js, so overrides are
 *     automatically scoped to a single test.
 *
 *   new HttpResponse(body, init)
 *     Construct a raw Response for non-JSON cases (status-only errors,
 *     redirects, etc).
 *
 *   HttpResponse.json(data, init?)
 *     Sugar for a JSON response.
 *
 *   delay(ms)  (imported from "msw")
 *     Inside a handler, pauses the response by N ms. Useful for testing
 *     loading states and race conditions.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "./mockServices/service";
import MyUser from "../components/ReactTesting/MyUser";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../api/userApi";

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

describe("Pattern 3 — MSW per-test overrides via server.use()", () => {
  // ─── BASELINE — default handlers from userHandlers.js apply ──────────────
  test("default happy path uses the handler from userHandlers.js", async () => {
    render(<MyUser name="mohit" printUser={() => {}} />);

    // userHandlers.js returns [{ name: "bison johnson", id: 123 }, ...]
    expect(await screen.findByText("bison johnson")).toBeInTheDocument();
    expect(screen.getByText("brett lee")).toBeInTheDocument();
  });

  // ─── OVERRIDE: simulate a 500 error ──────────────────────────────────────
  test("server.use can swap the GET handler to return 500 for THIS test only", async () => {
    server.use(
      http.get(USERS_URL, () => new HttpResponse(null, { status: 500 })),
    );

    render(<MyUser name="mohit" printUser={() => {}} />);

    // Component catches the rejection and sets the status message.
    expect(await screen.findByRole("status")).toHaveTextContent(
      /load failed: fetchUsers failed: 500/i,
    );
  });

  // ─── PROOF: the override above was reset before this test ────────────────
  test("the next test sees the DEFAULT handler again (reset between tests)", async () => {
    // No server.use here — afterEach(server.resetHandlers) from jest.setup.js
    // wiped the 500 override above. We're back to the userHandlers defaults.
    render(<MyUser name="mohit" printUser={() => {}} />);

    expect(await screen.findByText("bison johnson")).toBeInTheDocument();
  });

  // ─── OVERRIDE: simulate an empty list ────────────────────────────────────
  test("server.use can return an empty array to test the empty-state UI", async () => {
    server.use(http.get(USERS_URL, () => HttpResponse.json([])));

    render(<MyUser name="mohit" printUser={() => {}} />);

    // Wait for the fetch to complete (no <ul> renders when list is empty).
    await waitFor(() => {
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    // Component's static heading is still there.
    expect(screen.getByRole("heading", { name: /user's list/i })).toBeInTheDocument();
  });

  // ─── OVERRIDE: simulate a 401 unauthorized ───────────────────────────────
  test("server.use can return 401 to test auth-failure paths", async () => {
    server.use(
      http.get(USERS_URL, () => new HttpResponse(null, { status: 401 })),
    );

    render(<MyUser name="mohit" printUser={() => {}} />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /load failed: fetchUsers failed: 401/i,
    );
  });

  // ─── OVERRIDE: simulate network DELAY (for loading-state assertions) ─────
  test("server.use can delay responses to test loading states", async () => {
    server.use(
      http.get(USERS_URL, async () => {
        await delay(100); // 100ms delay — adjust based on your loading UI
        return HttpResponse.json([{ id: 555, name: "delayed user" }]);
      }),
    );

    render(<MyUser name="mohit" printUser={() => {}} />);

    // Before the delay resolves, the user list is empty — no <ul> yet.
    expect(screen.queryByText("delayed user")).not.toBeInTheDocument();

    // After the delay, the user appears.
    expect(await screen.findByText("delayed user")).toBeInTheDocument();
  });

  // ─── OVERRIDE: return DIFFERENT data on each call (sequencing) ───────────
  test("server.use can return different data based on conditional logic", async () => {
    let callCount = 0;
    server.use(
      http.get(USERS_URL, () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json([{ id: 1, name: "first call user" }]);
        }
        return HttpResponse.json([{ id: 2, name: "second call user" }]);
      }),
    );

    render(<MyUser name="mohit" printUser={() => {}} />);

    // Component fetches once on mount → sees the FIRST call's data.
    expect(await screen.findByText("first call user")).toBeInTheDocument();
    expect(callCount).toBe(1);
  });

  // ─── OVERRIDE: assert that a request was made with specific body ─────────
  test("server.use can inspect the request body and conditionally respond", async () => {
    // This pattern is super common: assert your component sent the right
    // payload to the server (without resorting to jest.mock on the api fn).
    let receivedBody = null;
    server.use(
      http.post(USERS_URL, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ ...receivedBody, id: 12345 }, { status: 201 });
      }),
    );

    render(<MyUser name="mohit" printUser={() => {}} />);
    await screen.findByText("bison johnson"); // wait for initial load

    const createBtn = screen.getByRole("button", { name: /create user/i });
    createBtn.click();

    // Wait for the POST to complete (status message appears).
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/created id 12345/i);
    });

    // Assert what the component sent in the request body.
    expect(receivedBody).toEqual({ name: "new user" });
  });
});

/**
 * ─── TESTING REJECTIONS WHEN THERE'S NO ERROR UI ────────────────────────────
 *
 * MyUser surfaces a status message on error, which is the easy case. In real
 * codebases plenty of components fail SILENTLY — they just don't update state,
 * or they log to a monitoring service, or they let a parent's onError handler
 * deal with it. Here are the patterns that work when there's nothing to assert
 * via the DOM.
 */
describe("Testing rejections WITHOUT an error UI", () => {
  // ─── Pattern #6 — await expect(...).rejects.toThrow() ─────────────────────
  // Test the API layer directly. No component involved — you're verifying
  // that the function throws when the server returns a non-2xx response.
  describe("Pattern #6 — direct .rejects.toThrow() on API functions", () => {
    test("fetchUsers throws on 500", async () => {
      server.use(
        http.get(
          "https://jsonplaceholder.typicode.com/users",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      // Cleanest one-liner — no try/catch needed.
      await expect(fetchUsers()).rejects.toThrow(/500/);
    });

    test("createUser throws on 422 validation error", async () => {
      server.use(
        http.post(
          "https://jsonplaceholder.typicode.com/users",
          () => new HttpResponse(null, { status: 422 }),
        ),
      );

      await expect(createUser({ name: "x" })).rejects.toThrow(/422/);
    });

    test("updateUser throws on 404", async () => {
      server.use(
        http.put(
          "https://jsonplaceholder.typicode.com/users/:id",
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      await expect(updateUser(1, { name: "x" })).rejects.toThrow(/404/);
    });

    test("deleteUser throws on 403", async () => {
      server.use(
        http.delete(
          "https://jsonplaceholder.typicode.com/users/:id",
          () => new HttpResponse(null, { status: 403 }),
        ),
      );

      await expect(deleteUser(1)).rejects.toThrow(/403/);
    });

    // Catching the actual error object — useful when you need to inspect
    // properties beyond the message.
    test("can inspect the thrown error object", async () => {
      server.use(
        http.get(
          "https://jsonplaceholder.typicode.com/users",
          () => new HttpResponse(null, { status: 503 }),
        ),
      );

      // .rejects + matcher chaining
      await expect(fetchUsers()).rejects.toBeInstanceOf(Error);
      // Re-trigger and capture for deeper inspection
      server.use(
        http.get(
          "https://jsonplaceholder.typicode.com/users",
          () => new HttpResponse(null, { status: 503 }),
        ),
      );
      try {
        await fetchUsers();
        throw new Error("should not reach here");
      } catch (err) {
        expect(err.message).toMatch(/fetchUsers failed: 503/);
      }
    });
  });

  // ─── Pattern #1 — spy on console.error / logger ───────────────────────────
  // For components that log silently instead of showing UI. Replace
  // `console.error` with `import { logError } from "../utils/logger"` if
  // your app uses a custom logger.
  describe("Pattern #1 — console.error / logger spy", () => {
    test("spying on console.error to confirm something logged on failure", async () => {
      // Common production pattern: error handler logs the error and silently
      // gives up. Without the spy, the failure would be invisible.
      const errSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Manually trigger a console.error to demonstrate the spy mechanics.
      // (Replace with the function-under-test that's expected to log.)
      console.error("background sync failed", new Error("offline"));

      expect(errSpy).toHaveBeenCalledTimes(1);
      expect(errSpy).toHaveBeenCalledWith(
        "background sync failed",
        expect.objectContaining({ message: "offline" }),
      );

      // ALWAYS restore — otherwise console.error stays silenced for
      // subsequent tests, which can hide real React warnings.
      errSpy.mockRestore();
    });
  });

  // ─── Pattern #2 — negative assertions when component fails silently ───────
  describe("Pattern #2 — negative assertions (state DIDN'T change)", () => {
    test("on fetchUsers failure, the list never renders any users", async () => {
      server.use(
        http.get(
          "https://jsonplaceholder.typicode.com/users",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      render(<MyUser name="mohit" printUser={() => {}} />);

      // First confirm the error path actually ran — the status message appears.
      // (Even though we're showing the negative-assertion pattern, we still
      // need to await the failure or the test ends before MyUser settles.)
      await screen.findByRole("status");

      // The KEY assertions: the data side of the UI is empty. Even without
      // the status message, these would prove the failed fetch was a no-op.
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    });
  });
});

/**
 * ─── ANTI-PATTERNS TO AVOID ─────────────────────────────────────────────────
 *
 *   ❌ Defining error handlers in userHandlers.js as defaults
 *     If the default response is a 500, every other test has to override
 *     back to a 200. Defaults should be happy-path; errors are overrides.
 *
 *   ❌ Forgetting afterEach(server.resetHandlers)
 *     Your jest.setup.js already has this — but if you remove it, an
 *     override in one test will silently leak into all subsequent tests.
 *
 *   ❌ Copying the same server.use override to 3+ tests
 *     Promote it to a named handler in the domain file:
 *
 *       // userHandlers.js
 *       export const slowUsersHandler = http.get(USERS_URL, async () => {
 *         await delay(2000);
 *         return HttpResponse.json([...]);
 *       });
 *
 *       // in tests
 *       server.use(slowUsersHandler);
 *
 *   ❌ Mixing server.use with jest.mock("../api/userApi")
 *     If you've jest.mocked the API module, the fetch never runs — MSW
 *     overrides are ignored. Pick one strategy per test file.
 */
