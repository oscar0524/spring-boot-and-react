import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定義認證狀態的初始值
const initialState = {
  accessToken: '', // 存儲訪問令牌
  userName: '', // 存儲用戶名稱
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
    // 設置用戶名稱
    setUserName: (state, action: PayloadAction<{ userName: string }>) => ({
      ...state,
      ...action.payload,
    }),
    // 設置訪問令牌
    setAccessToken: (
      state,
      action: PayloadAction<{ accessToken: string }>
    ) => ({ ...state, ...action.payload }),
    // 清除訪問令牌
    clearAccessToken: (state) => {
      state.accessToken = '';
    },
  },
  // 定義選擇器函數
  selectors: {
    // 獲取當前訪問令牌
    getAccessToken: (state) => state.accessToken,
    // 獲取當前用戶名稱
    getUserName: (state) => state.userName,
  },
});

// 導出 actions 供組件使用
export const authActions = authSlice.actions;
// 導出 reducer 供 store 配置使用
export const authReducer = authSlice.reducer;
// 導出 selectors 供組件獲取狀態
export const authSelectors = authSlice.selectors;
