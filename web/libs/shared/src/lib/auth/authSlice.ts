import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Token } from './token';
import { UserInfo } from './userInfo';

type state = {
  token: Token;
  userInfo: UserInfo;
};

// 定義認證狀態的初始值
const initialState: state = {
  token: {
    accessToken: '',
    refreshToken: '',
  },
  userInfo: {
    username: '',
  },
};

export const authSlice = createSlice({
  name: 'auth', // slice 的命名空間
  initialState, // 初始狀態
  reducers: {
    // 空操作，不改變狀態
    emptyAction: (state) => state,
    // 用於觸發加載 accessToken 的副作用
    loadAccessToken: (state) => state,
    // 用於觸發加載用戶資訊的副作用
    loadUserInfo: (state) => state,
    // 登入操作，重置狀態
    login: (state) => ({ ...initialState }),
    // 登出操作，清除所有認證信息
    logout: (state) => ({ ...initialState }),
    // 加載令牌，重置狀態
    loadToken: (state) => ({ ...initialState }),
    refreshToken: (state) => state,
    // 設置用戶名稱
    setUserInfo: (state, action: PayloadAction<{ userInfo: UserInfo }>) => ({
      ...state,
      ...action.payload,
    }),
    // 設置訪問令牌
    setToken: (state, action: PayloadAction<{ token: Token }>) => ({
      ...state,
      ...action.payload,
    }),
    // 清除訪問令牌
    clearToken: (state) => ({
      ...state,
      token: { ...initialState.token },
    }),
  },
  // 定義選擇器函數
  selectors: {
    // 獲取當前訪問令牌
    getAccessToken: (state) => state.token.accessToken,
    getToken: (state) => state.token,
    // 獲取當前用戶名稱
    getUserName: (state) => state.userInfo.username,
  },
});

// 導出 actions 供組件使用
export const authActions = authSlice.actions;
// 導出 reducer 供 store 配置使用
export const authReducer = authSlice.reducer;
// 導出 selectors 供組件獲取狀態
export const authSelectors = authSlice.selectors;
