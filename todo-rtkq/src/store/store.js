import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { apiSlice } from "./ApiSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import filterReducer from "./FilterSlice";

// Custom localStorage adapter. Avoids the redux-persist v6 + Vite ESM/CJS
// interop bug where `import storage from "redux-persist/lib/storage"` resolves
// to { default: {...} }, leaving storage.getItem/setItem undefined.
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer, // server cache
  filter: filterReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["filter"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoreActions: [FLUSH, REGISTER, REHYDRATE, PAUSE, PERSIST, PURGE],
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
