/**
 * 基於 axios-observable 的 HTTP 客戶端工具
 * 提供自動處理認證 token、token 刷新和錯誤處理的功能
 */
import Axios from 'axios-observable'; // 引入 axios 的 observable 版本，支持 RxJS
import { authActions, authSelectors, Token } from '../auth'; // 引入認證相關的 actions、selectors 和類型
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux hooks
import { Dispatch } from 'redux'; // 引入 Redux dispatch 類型
import { lastValueFrom, shareReplay } from 'rxjs'; // 引入 RxJS 工具函數
import { authService } from '../auth/authService'; // 引入認證服務

/**
 * 建立一個 Axios Observable 實例
 * @param dispatch - Redux dispatch 函數，用於派發 action
 * @param token - 包含 accessToken 和 refreshToken 的對象
 * @returns 配置好的 Axios Observable 實例
 */
export const createAxiosObservableInstance = (
  dispatch: Dispatch,
  token: Token
) => {
  const { accessToken, refreshToken } = token;
  const instance = Axios.create({});

  // 請求攔截器 - 加入認證 token
  instance.interceptors.request.use(
    (config) => {
      // 為每個請求自動添加 Authorization 頭部與 token
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;

      return config;
    },
    (error) => {
      // 請求錯誤處理
      return Promise.reject(error);
    }
  );

  // 響應攔截器 - 處理 401 錯誤
  instance.interceptors.response.use(
    (response) => {
      // 正常響應直接返回
      return response;
    },
    async (error) => {
      // 處理未授權錯誤 (401)
      if (error.response && error.response.status === 401) {
        try {
          // 嘗試利用 refreshToken 取得新的 accessToken
          const tokenResponse = await lastValueFrom(
            authService.refreshToken(refreshToken)
          );

          if (tokenResponse.data && tokenResponse.data.accessToken) {
            // 成功獲取新 token，更新原始請求的認證頭部
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${tokenResponse.data.accessToken}`;

            // 重試原始請求，並使用 shareReplay 確保多個訂閱者只觸發一次請求
            const newRequest = instance
              .request(originalRequest)
              .pipe(shareReplay(1));

            // 當請求完成時，更新 Redux store 中的 token
            newRequest.subscribe({
              complete: () => {
                dispatch(authActions.setToken({ token: tokenResponse.data }));
              },
            });

            // 等待並返回重試請求的結果
            return lastValueFrom(newRequest);
          }
        } catch (refreshError) {
          // token 刷新失敗，記錄錯誤
          console.error('Token refresh failed:', refreshError);
        }
        // token 刷新失敗或沒有新 token，觸發登入流程
        dispatch(authActions.login());
      }
      // 其他錯誤或處理失敗的 401 錯誤，返回 rejected promise
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * 提供可在 React 組件中使用的 Axios Observable 實例的 Hook
 * 自動從 Redux store 獲取當前 token
 * @returns 配置好的 Axios Observable 實例
 */
export const useAxiosObservable = () => {
  const dispatch = useDispatch();
  const token = useSelector(authSelectors.getToken);

  return createAxiosObservableInstance(dispatch, token);
};
