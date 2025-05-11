import Axios from 'axios-observable';
import { authActions, authSelectors } from '../auth';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { lastValueFrom } from 'rxjs';
import { authService } from '../auth/authService';

export const createAxiosObservableInstance = (
  dispatch: Dispatch,
  accessToken: string
) => {
  const instance = Axios.create({});

  // 請求攔截器 - 加入認證 token
  instance.interceptors.request.use(
    (config) => {
      // 如果提供了 token 參數則使用，否則從 store 獲取
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 響應攔截器 - 處理 401 錯誤
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response && error.response.status === 401) {
        try {
          // 嘗試取得新的 accessToken
          const tokenResponse = await lastValueFrom(
            authService.refreshToken(accessToken)
          );

          if (tokenResponse.data && tokenResponse.data.accessToken) {
            // 更新 store 中的 token
            dispatch(
              authActions.setAccessToken(tokenResponse.data.accessToken)
            );

            // 更新原始請求的 headers 並重試請求
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${tokenResponse.data.accessToken}`;

            // 重試原始請求
            return lastValueFrom(instance.request(originalRequest));
          }
        } catch (refreshError) {
          // 取得 token 失敗，執行登入
          console.error('Token refresh failed:', refreshError);
        }
        dispatch(authActions.login());
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// hook 版本，只能在 React 函數組件或自定義 hook 中使用
export const useAxiosObservable = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(authSelectors.getAccessToken);

  return createAxiosObservableInstance(dispatch, accessToken);
};
