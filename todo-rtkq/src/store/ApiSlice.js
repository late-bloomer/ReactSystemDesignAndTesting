import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBasedQuery } from "./AxiosBasedQuery";

/**
 * The JSONPlaceholder caveat — now you'll see it firsthand
    JSONPlaceholder fakes writes. It returns a success response (status 200/201) with a plausible body,
    but it doesn't actually save anything. So here's what you'll observe:
    The mutation succeeds (no error, you'll see it in the Network tab), the LIST tag invalidates, 
    getTodos refetches—and the refetch returns the original unchanged 10 todos, because the server 
    never stored your change. So your new todo appears to vanish, and your toggle reverts, right after 
    the refetch.
    This is not a bug in your code—it's the fake backend, and it's genuinely useful to witness: 
    it proves the invalidation→refetch loop is actually firing (the list resets because it refetched). 
    Open the Network tab and you'll see the POST/PATCH/DELETE, immediately followed by a fresh GET /todos. 
    That sequence is the whole lesson of this step. When we build the Notes app on a real json-server in the next phase, 
    the same code will make writes that actually stick
 */

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBasedQuery({
    baseUrl: "https://jsonplaceholder.typicode.com",
  }),
  tagTypes: ["Todo"],
  endpoints: (builder) => ({
    getTodos: builder.query({
      query: () => ({ url: "/todos", method: "GET", params: { _limit: 10 } }),
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: "Todo", id })),
        { type: "Todo", id: "LIST" },
      ],
    }),

    addTodo: builder.mutation({
      query: (newTodoData) => ({
        url: "/todos",
        method: "POST",
        data: newTodoData,
      }),
      invalidatesTags: [{ type: "Todo", id: "LIST" }],
    }),

    updateTodo: builder.mutation({
      query: ({ id, ...patchData }) => ({
        url: `/todos/${id}`,
        method: "PATCH",
        data: patchData,
      }),
      invalidatesTags: (results, error, { id }) => [{ type: "Todo", id }],
    }),

    deleteTodo: builder.mutation({
      query: ({ id }) => ({
        url: `todos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (results, error, id) => ({ type: "Todo", id }),
    }),
  }),
});

export const {
  useGetTodosQuery,
  useAddTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = apiSlice;
