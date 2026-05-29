/**
 * ============================================================================
 *  ContextJestMock.test.jsx — Context tests using jest.mock on the HOOK
 * ============================================================================
 *
 * Companion to ReduxAndContext.test.jsx (which uses the real <Provider> wrap).
 * This file demonstrates the ALTERNATIVE pattern: short-circuit the context
 * by mocking the custom hook (`useTheme`) at the module layer.
 *
 * ─── PROVIDER-WRAP vs jest.mock — WHICH SHOULD I USE? ───────────────────────
 *
 *   Default to <Provider> wrap (95% of the time):
 *     • Most realistic — exercises the real hook + Provider integration
 *     • Cheap to set up (Context has no async, no network, no overhead)
 *     • A small renderWithProviders helper makes the wrap one-line
 *
 *   Reach for jest.mock the hook when:
 *     ✓ The Provider tree is DEEP (3+ providers) and assembling them all is
 *       tedious for every test
 *     ✓ The Provider has EXPENSIVE setup (real network, big initial state,
 *       useEffect side-effects) you want to skip
 *     ✓ You want different mock values per test WITHOUT rebuilding the
 *       wrapper component each time
 *     ✓ You want to ASSERT the hook was called (rare — hooks are usually
 *       argless)
 *     ✗ Don't use just because "it feels simpler" — the Provider wrap is
 *       almost always more honest about what the code does in production.
 *
 * ─── HOW IT WORKS ───────────────────────────────────────────────────────────
 *
 *   jest.mock("../contexts/ThemeContext", () => ({
 *     useTheme: jest.fn(),
 *   }));
 *
 *   This replaces the WHOLE module — every export becomes undefined unless
 *   you provide it. Critically, this means `<ThemeContext.Provider>` and
 *   `<ThemeProvider>` are ALSO undefined in this file. We don't need them
 *   here because our consumer (`ThemedButton`) only reads via useTheme.
 *
 *   To preserve some real exports while overriding others, use the partial
 *   pattern with jest.requireActual (see PartialMock.test.jsx).
 *
 * ─── INTERVIEW-GRADE GOTCHA: jest.mock IS FILE-SCOPED ──────────────────────
 *
 *   Once `jest.mock("../contexts/ThemeContext")` runs at the top of THIS
 *   file, every test in THIS file gets the mocked hook. That's why we need
 *   a separate file from ReduxAndContext.test.jsx (which uses the real hook).
 *   The two files cannot coexist as one.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemedButton } from "../components/ThemedButton";
import { useTheme } from "../contexts/ThemeContext";

// ─── STEP 1 — mock the hook at the module layer ────────────────────────────
// Hoisted above all imports by Jest's Babel plugin. The `useTheme` we
// imported above is automatically the mocked version below.
jest.mock("../contexts/ThemeContext", () => ({
  // Default to a jest.fn() — individual tests set its return value.
  useTheme: jest.fn(),
}));

describe("ContextJestMock — useTheme hook is mocked, no Provider needed", () => {
  beforeEach(() => {
    // Reset between tests. mockReset wipes both calls AND any implementation
    // set in a previous test.
    useTheme.mockReset();
  });

  // ─── BASIC USE — control the value per test ──────────────────────────────
  test("returns the mocked theme value without any Provider", () => {
    // The mocked hook returns whatever we say. NO <ThemeProvider> wrapping.
    useTheme.mockReturnValue({ theme: "dark", toggle: jest.fn() });

    render(<ThemedButton>Click me</ThemedButton>);

    expect(screen.getByRole("button")).toHaveClass("btn-dark");
    expect(screen.getByRole("button")).toHaveTextContent(/dark/);
  });

  test("can flip the value to 'light' in another test with zero wrapper changes", () => {
    useTheme.mockReturnValue({ theme: "light", toggle: jest.fn() });

    render(<ThemedButton>Click me</ThemedButton>);

    expect(screen.getByRole("button")).toHaveClass("btn-light");
  });

  // ─── ASSERTING THE HOOK WAS CALLED ──────────────────────────────────────
  test("can assert useTheme was actually called by the component", () => {
    useTheme.mockReturnValue({ theme: "light", toggle: jest.fn() });

    render(<ThemedButton>Hi</ThemedButton>);

    // Re-rendering or unrelated work might call the hook more times — but
    // it MUST have been called at least once.
    expect(useTheme).toHaveBeenCalled();
  });

  // ─── ASSERTING THE TOGGLE CALLBACK WAS INVOKED ──────────────────────────
  test("can spy on the toggle function passed via context", async () => {
    const user = userEvent.setup();
    const toggleSpy = jest.fn();

    useTheme.mockReturnValue({ theme: "light", toggle: toggleSpy });

    render(<ThemedButton>Toggle me</ThemedButton>);

    await user.click(screen.getByRole("button"));

    // Because we mocked toggle, no real state update happens — but we
    // can verify the consumer wired the click to the context function.
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  // ─── PER-CALL CONTROL (rare but useful) ─────────────────────────────────
  test("mockReturnValueOnce queues different values across consecutive calls", () => {
    // First call → light, second call → dark. Each render() re-runs the
    // component which calls useTheme again.
    useTheme
      .mockReturnValueOnce({ theme: "light", toggle: jest.fn() })
      .mockReturnValueOnce({ theme: "dark", toggle: jest.fn() });

    const { unmount } = render(<ThemedButton>X</ThemedButton>);
    expect(screen.getByRole("button")).toHaveClass("btn-light");
    unmount();

    render(<ThemedButton>X</ThemedButton>);
    expect(screen.getByRole("button")).toHaveClass("btn-dark");
  });
});

/**
 * ─── COMPARISON WITH ReduxAndContext.test.jsx ───────────────────────────────
 *
 *   Same component (ThemedButton) tested two ways:
 *
 *   ┌──────────────────────────┬────────────────────────────────────────────┐
 *   │ ReduxAndContext.test.jsx │ Real <ThemeProvider> wraps the component   │
 *   │ (Provider-wrap)          │ Tests integration: hook + Provider + state │
 *   │                          │ Slower setup, MORE realistic               │
 *   ├──────────────────────────┼────────────────────────────────────────────┤
 *   │ ContextJestMock          │ useTheme is jest.fn() — no Provider needed │
 *   │ (this file)              │ Tests consumer in isolation                │
 *   │                          │ Faster setup, LESS realistic               │
 *   └──────────────────────────┴────────────────────────────────────────────┘
 *
 *   Both are valid. The Provider-wrap is the default; jest.mock is the
 *   escape hatch for cases where the wrap is heavyweight or you need
 *   per-test value control without rebuilding wrappers.
 *
 * ─── INTERVIEW-READY ANSWER ─────────────────────────────────────────────────
 *
 *   "I default to wrapping components in their real <Provider> in tests —
 *    it's the most realistic and Context has no setup cost. I reach for
 *    jest.mock on the custom hook when the Provider tree is deep, the
 *    Provider has expensive setup I want to skip, or I need fine-grained
 *    per-test value control without rebuilding wrapper components. The
 *    trade-off is realism: mocking the hook bypasses the real Provider
 *    integration, so I never use it as the only test for a component —
 *    just as a supplement to Provider-wrapped integration tests."
 */
