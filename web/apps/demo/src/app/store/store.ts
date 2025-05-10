import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import { authReducer } from './slice/auth/auth-slice';
import { persistReducer, persistStore } from 'redux-persist';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { authEpic } from './slice/auth/auth-effect';
import { createAxiosInstance } from '../hook/useAxios';
import sessionStorage from 'redux-persist/lib/storage/session';

const rootReducer = combineReducers({
  auth: authReducer,
});
type RootState = ReturnType<typeof rootReducer>;

const epicMiddlewareDependencies = {
  axios: () => {
    // 在運行時從 store 獲取 state 和 dispatch
    const state = store.getState();
    const dispatch = store.dispatch;
    const accessToken = state.auth.accessToken;
    return createAxiosInstance(dispatch, accessToken);
  },
};

export type EpicDependencies = typeof epicMiddlewareDependencies;

export const rootEpic = combineEpics<
  Action,
  Action,
  RootState,
  EpicDependencies
>(...authEpic);

const epicMiddleware = createEpicMiddleware<
  Action,
  Action,
  RootState,
  EpicDependencies
>({
  dependencies: epicMiddlewareDependencies,
});

const persistConfig = {
  key: 'root',
  storage: sessionStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(epicMiddleware),
});

export const persistor = persistStore(store);

epicMiddleware.run(rootEpic);
