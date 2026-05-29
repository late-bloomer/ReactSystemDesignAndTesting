// Pure logic — no side effects, no external calls.
// We WANT this to stay REAL during tests because it's deterministic
// and there's no value in mocking pure functions.
export function formatUserName(user) {
  if (!user || !user.name) return "Unknown User";
  return user.name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

// Side-effecting function — reads the real wall clock.
// In tests we MUST mock this, otherwise assertions become non-deterministic
// (the value changes every millisecond).
export function getCurrentTimestamp() {
  return Date.now();
}

// Another side-effecting function — writes to the console.
// In tests we usually want to mock this so we can assert it was called
// without polluting test output.
export function logUserAction(action, user) {
  console.log(`[${getCurrentTimestamp()}] ${action}: ${formatUserName(user)}`);
}
