/**
 * Production store config. Tests construct their own store via
 * configureStore inside renderWithProviders so each test gets a fresh
 * isolated state.
 */
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
