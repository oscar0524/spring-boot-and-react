import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  accessToken: '',
  userName: '',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    emptyAction: (state) => state,
    loadAccessToken: (state) => state,
    loadUserInfo: (state) => state,
    login: (state) => ({ ...initialState }),
    setUserName: (state, action: PayloadAction<{ userName: string }>) => ({
      ...state,
      ...action.payload,
    }),
    setAccessToken: (
      state,
      action: PayloadAction<{ accessToken: string }>
    ) => ({ ...state, ...action.payload }),
    clearAccessToken: (state) => {
      state.accessToken = '';
    },
  },
  selectors: {
    getAccessToken: (state) => state.accessToken,
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;
export const authSelectors = authSlice.selectors;
