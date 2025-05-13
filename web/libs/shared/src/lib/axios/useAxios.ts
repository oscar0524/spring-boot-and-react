/**
 * 標準 Axios HTTP 客戶端工具
 * 提供自動處理認證 token、token 刷新、請求中斷和錯誤處理的功能
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'; // 引入 axios 及其類型
import { authActions, authSelectors, authService, Token } from '../auth'; // 引入認證相關的功能和類型
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux hooks
import { Dispatch } from 'redux'; // 引入 Redux dispatch 類型
import { useEffect } from 'react'; // 引入 React hooks
import { lastValueFrom } from 'rxjs'; // 引入 RxJS 工具

/**
 * 擴展 Axios 實例類型，新增中斷請求功能
 */
export interface AxiosInstanceWithAbort extends AxiosInstance {
  /**
   * 以可中斷的方式發送請求
   * @param config - Axios 請求配置
   * @returns 包含請求 Promise 和中斷方法的物件
   */
  requestWithAbort: <T = any>(
    config: AxiosRequestConfig
  ) => {
    request: Promise<AxiosResponse<T>>;
    abort: (reason?: string) => void;
  };
  /**
   * 中斷所有進行中的請求
   * @param reason - 中斷原因
   */
  abortAll: (reason?: string) => void;
}

/**
 * 建立一個具有中斷功能的 Axios 實例
 * @param dispatch - Redux dispatch 函數，用於派發 action
 * @param token - 包含 accessToken 和 refreshToken 的對象
 * @returns 擴展後的 Axios 實例
 */
export const createAxiosInstance = (
  dispatch: Dispatch,
  token: Token
): AxiosInstanceWithAbort => {
  const { accessToken, refreshToken } = token;
  const instance = axios.create({}) as AxiosInstanceWithAbort;
  const abortControllers = new Map<string, AbortController>(); // 存儲所有進行中請求的中斷控制器

  /**
   * 新增可中斷請求的方法
   * 每個請求都會生成唯一 ID 和對應的 AbortController
   */
  instance.requestWithAbort = (config) => {
    const controller = new AbortController();
    const requestId =
      Date.now().toString() + Math.random().toString(36).substring(2); // 生成唯一請求 ID

    // 將 signal 加入到請求配置
    config.signal = controller.signal;
    abortControllers.set(requestId, controller);

    // 發送請求並在完成後自動清理
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

  /**
   * 中斷所有請求的方法
   * 用於一次性取消所有進行中的請求
   */
  instance.abortAll = (reason?: string) => {
    abortControllers.forEach((controller) => {
      controller.abort(reason || '使用者中斷所有請求');
    });
    abortControllers.clear();
  };

  /**
   * 請求攔截器 - 加入認證 token
   * 在發送請求前自動添加 Authorization 頭部
   */
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

  /**
   * 響應攔截器 - 處理 401 錯誤和請求中斷的情況
   */
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

      // 處理 401 授權錯誤（token 過期）
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
            authService.refreshToken(refreshToken)
          );
          const newToken = response.data; // 根據實際回應結構調整

          if (!newToken) {
            // 如果沒有新的 token，則觸發登入流程
            dispatch(authActions.login());
            return Promise.reject(error);
          }

          // 更新當前請求的 Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken.accessToken}`;

          // 重試原請求
          const newRequest = axios(originalRequest);

          newRequest.finally(() => {
            // 更新 store 中的 token
            dispatch(authActions.setToken({ token: newToken }));
          });

          return newRequest;
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

/**
 * 提供可在 React 組件中使用的 Axios 實例的 Hook
 * 自動從 Redux store 獲取當前 token，並在組件卸載時取消所有請求
 * @returns 配置好的 Axios 實例，帶有可中斷功能
 */
export const useAxios = () => {
  const dispatch = useDispatch();
  const token = useSelector(authSelectors.getToken);
  const axiosInstance = createAxiosInstance(dispatch, token);

  // 組件卸載時自動取消所有請求
  useEffect(() => {
    return () => {
      axiosInstance.abortAll('組件已卸載');
    };
  }, [axiosInstance]);

  return axiosInstance;
};
