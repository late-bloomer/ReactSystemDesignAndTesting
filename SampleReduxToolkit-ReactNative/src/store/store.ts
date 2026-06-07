import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer, PersistConfig} from 'redux-persist';
import safeStorage from './safeStorage'; // custom storage
import rootReducer from './rootReducer';

const isDev = process.env.NODE_ENV === 'development';

// Define the persist configuration type
type RootState = ReturnType<typeof rootReducer>;

// Redux Persist Configuration
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: safeStorage,
  transforms: [], // we need to pass the encryptor.
  blacklist: [], // we can any blacklisted reducer
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: isDev, // Enable DevTools in development mode only
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // Necessary for redux-persist
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
