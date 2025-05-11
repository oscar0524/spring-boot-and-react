import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authActions, authSelectors, authService } from '@demo/shared/lib/auth';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { useEffect } from 'react';
import { lastValueFrom } from 'rxjs';

// 擴展 Axios 實例類型，新增中斷請求功能
export interface AxiosInstanceWithAbort extends AxiosInstance {
  // 以可中斷的方式發送請求
  requestWithAbort: <T = any>(
    config: AxiosRequestConfig
  ) => {
    request: Promise<AxiosResponse<T>>;
    abort: (reason?: string) => void;
  };
  // 中斷所有進行中的請求
  abortAll: (reason?: string) => void;
}

export const createAxiosInstance = (
  dispatch: Dispatch,
  accessToken: string
): AxiosInstanceWithAbort => {
  const instance = axios.create({}) as AxiosInstanceWithAbort;
  const abortControllers = new Map<string, AbortController>();

  // 新增可中斷請求的方法
  instance.requestWithAbort = (config) => {
    const controller = new AbortController();
    const requestId =
      Date.now().toString() + Math.random().toString(36).substring(2);

    // 將 signal 加入到請求配置
    config.signal = controller.signal;
    abortControllers.set(requestId, controller);

    // 發送請求
    const request = instance.request(config).finally(() => {
      abortControllers.delete(requestId);
    });

    // 返回請求和中斷函數
    return {
      request,
      abort: (reason?: string) => {
        if (abortControllers.has(requestId)) {
          controller.abort(reason || '使用者中斷請求');
          abortControllers.delete(requestId);
        }
      },
    };
  };

  // 中斷所有請求的方法
  instance.abortAll = (reason?: string) => {
    abortControllers.forEach((controller) => {
      controller.abort(reason || '使用者中斷所有請求');
    });
    abortControllers.clear();
  };

  // 請求攔截器 - 加入認證 token
  instance.interceptors.request.use(
    (config) => {
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
      // 處理請求被中斷的情況
      if (axios.isCancel(error)) {
        console.log('請求已被中斷:', error.message);
        return Promise.reject(error);
      }

      // 處理 401 授權錯誤
      if (error.response && error.response.status === 401) {
        const originalRequest = error.config;
        // 避免無限重試
        if (originalRequest._retry) {
          // 已經嘗試過重試，但仍然失敗
          dispatch(authActions.login());
          return Promise.reject(error);
        }
        originalRequest._retry = true;
        try {
          // 嘗試獲取新 token
          const response = await lastValueFrom(
            authService.refreshToken(accessToken)
          );
          const newToken = response.data.accessToken; // 根據實際回應結構調整

          if (!newToken) {
            // 如果沒有新的 token，則觸發登入流程
            dispatch(authActions.login());
            return Promise.reject(error);
          }
          // 更新 store 中的 token
          dispatch(authActions.setAccessToken(newToken));

          // 更新當前請求的 Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // 重試原請求
          return axios(originalRequest);
        } catch (refreshError) {
          console.log('重新獲取 token 失敗:', refreshError);
          // 重新獲取 token 失敗，觸發登入流程
          dispatch(authActions.login());
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
};

// hook 版本，只能在 React 函數組件或自定義 hook 中使用
export const useAxios = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(authSelectors.getAccessToken);
  const axiosInstance = createAxiosInstance(dispatch, accessToken);

  // 組件卸載時自動取消所有請求
  useEffect(() => {
    return () => {
      axiosInstance.abortAll('組件已卸載');
    };
  }, [axiosInstance]);

  return axiosInstance;
};
