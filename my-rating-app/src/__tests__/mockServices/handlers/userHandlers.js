/**
 * Domain handlers for the User API.
 *
 * Default happy-path responses live here. Edge cases (errors, empty lists,
 * delays) are added per-test via `server.use(...)` — see MswOverride.test.jsx.
 */
import { http, HttpResponse } from "msw";

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

export const userHandlers = [
  http.get(USERS_URL, () => {
    return HttpResponse.json([
      { name: "bison johnson", id: 123 },
      { name: "brett lee", id: 124 },
    ]);
  }),

  http.post(USERS_URL, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, id: 999 }, { status: 201 });
  }),

  http.put(`${USERS_URL}/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, id: Number(params.id) });
  }),

  http.delete(`${USERS_URL}/:id`, ({ params }) => {
    return HttpResponse.json({ id: Number(params.id) });
  }),
];
