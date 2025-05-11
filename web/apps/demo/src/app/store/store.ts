// 引入必要的 Redux 相關依賴
import { Action, combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  authReducer,
  authEpic,
  authEpicDependencies,
} from '@demo/shared/lib/auth';
// 引入 Redux-Persist 相關函數，用於狀態持久化
import { persistReducer, persistStore } from 'redux-persist';
// 引入 Redux-Observable 相關函數，用於處理非同步操作
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { createAxiosObservableInstance } from '@demo/shared/lib/axios'; // 導入 Axios 實例創建函數
// 使用 sessionStorage 作為持久化儲存媒介
import sessionStorage from 'redux-persist/lib/storage/session';

// 合併所有 reducer
const rootReducer = combineReducers({
  auth: authReducer, // 驗證相關的 reducer
});
// 定義根狀態類型，用於提供正確的類型推斷
type RootState = ReturnType<typeof rootReducer>;

// 導出 Epic 依賴類型，供其他模組使用
export type EpicDependencies = authEpicDependencies;

// 定義 Epic 中間件的依賴
const epicMiddlewareDependencies: EpicDependencies = {
  axios: () => {
    // 在運行時從 store 獲取 state 和 dispatch
    const state = store.getState();
    const dispatch = store.dispatch;
    const token = state.auth.token;
    // 創建帶有認證令牌的 axios 實例
    return createAxiosObservableInstance(dispatch, token);
  },
};

// 組合所有的 Epic 函數，處理非同步操作
export const rootEpic = combineEpics<
  Action,
  Action,
  RootState,
  EpicDependencies
>(...authEpic);

// 創建 Epic 中間件，用於處理非同步操作的流程
const epicMiddleware = createEpicMiddleware<
  Action,
  Action,
  RootState,
  EpicDependencies
>({
  dependencies: epicMiddlewareDependencies,
});

// 配置 Redux-Persist，用於狀態持久化
const persistConfig = {
  key: 'root', // 持久化的根節點
  storage: sessionStorage, // 使用 session 儲存，頁面關閉後數據會消失
  whitelist: ['auth'], // 只持久化 auth 模塊的狀態
};

// 創建持久化的 reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 創建並配置 Redux store
export const store = configureStore({
  reducer: persistedReducer, // 使用持久化的 reducer
  devTools: process.env.NODE_ENV !== 'production', // 只在非生產環境啟用 Redux DevTools
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 禁用序列化檢查，允許存儲非序列化數據
    }).concat(epicMiddleware), // 加入 Epic 中間件
});

// 創建持久化的 store 實例
export const persistor = persistStore(store);

// 啟動 Epic 中間件
epicMiddleware.run(rootEpic);
