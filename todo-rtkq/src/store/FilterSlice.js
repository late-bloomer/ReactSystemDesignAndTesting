import { createSlice, createSelector } from "@reduxjs/toolkit";
import { apiSlice } from "./ApiSlice";

const filterSlice = createSlice({
  name: "filter",
  initialState: { status: "all" }, // 'all', 'active', 'completed'
  reducers: {
    setFilter: (state, action) => {
      state.status = action.payload; // immer makes this mutation safe
    },
  },
});

export const { setFilter } = filterSlice.actions;
export const selectFilter = (state) => state.filter.status; // named selector
export default filterSlice.reducer;

// Input selector #1: the cached getTodos result, read from the RTKQ cache.
// apiSlice.endpoints.getTodos.select() returns a selector for that cache entry;
// .data is the actual array (may be undefined before the first fetch).
const selectTodosResult = apiSlice.endpoints.getTodos.select();
const selectAllTodos = createSelector(
  selectTodosResult,
  (result) => result?.data ?? [], // always return an array
);

// The memoized derived selector: combine todos + filter.
export const selectVisibleTodos = createSelector(
  [selectAllTodos, selectFilter], // inputs
  (todos, filter) => {
    // result fn — runs only when inputs change
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos; // 'all'
  },
);
