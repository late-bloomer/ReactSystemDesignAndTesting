/**
 * Domain handlers for the counter feature.
 * The fetchInitialCount thunk hits /count and expects { value: number }.
 */
import { http, HttpResponse } from "msw";

const COUNT_URL = "https://jsonplaceholder.typicode.com/count";

export const counterHandlers = [
  http.get(COUNT_URL, () => HttpResponse.json({ value: 42 })),
];
