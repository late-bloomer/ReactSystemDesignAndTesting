import "@testing-library/jest-dom";
import { server } from "./src/__tests__/mockServices/service";

// React 18+ uses this global to know it's in a test environment.
// @testing-library/react usually sets it on import, but custom test
// environments (e.g. jest-fixed-jsdom) can sometimes drop it — setting
// it here explicitly prevents the "not configured to support act(...)" warning.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
