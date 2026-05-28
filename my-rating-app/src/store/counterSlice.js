/**
 * Redux Toolkit slice for a tiny counter feature.
 *
 * Notable parts for testing:
 *   • Synchronous reducers (increment, decrement, addBy)
 *   • An async thunk (fetchInitialCount) that pulls a number from an API
 *   • extraReducers for the thunk lifecycle (pending/fulfilled/rejected)
 *
 * Anything exported from here is testable in isolation — reducer function,
 * action creators, the thunk itself, and selectors.
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const COUNT_URL = "https://jsonplaceholder.typicode.com/count";

// ─── ASYNC THUNK ─────────────────────────────────────────────────────────────
// createAsyncThunk auto-generates three action types:
//   counter/fetchInitialCount/pending
//   counter/fetchInitialCount/fulfilled
//   counter/fetchInitialCount/rejected
export const fetchInitialCount = createAsyncThunk(
  "counter/fetchInitialCount",
  async () => {
    const response = await fetch(COUNT_URL);
    if (!response.ok) throw new Error(`fetchInitialCount failed: ${response.status}`);
    const data = await response.json();
    return data.value; // becomes action.payload in fulfilled
  },
);

const counterSlice = createSlice({
  name: "counter",
  initialState: {
    value: 0,
    status: "idle", // "idle" | "loading" | "succeeded" | "failed"
    error: null,
  },
  // ─── SYNC REDUCERS ─────────────────────────────────────────────────────────
  // Each one produces an action creator with the same name (immer-powered).
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    addBy: (state, action) => {
      state.value += action.payload;
    },
    reset: (state) => {
      state.value = 0;
      state.status = "idle";
      state.error = null;
    },
  },
  // ─── EXTRA REDUCERS — handle the thunk's three lifecycle actions ───────────
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialCount.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInitialCount.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.value = action.payload;
      })
      .addCase(fetchInitialCount.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

// Action creators (auto-generated from the reducers above)
export const { increment, decrement, addBy, reset } = counterSlice.actions;

// Selectors (pure functions — also unit-testable in isolation)
export const selectCount = (state) => state.counter.value;
export const selectStatus = (state) => state.counter.status;
export const selectError = (state) => state.counter.error;

export default counterSlice.reducer;
