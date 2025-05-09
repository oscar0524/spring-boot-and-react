import Axios from 'axios-observable';
import { authActions, authSelectors } from '../store/slice/auth/auth-slice';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';

export const createAxiosInstance = (
  dispatch: Dispatch,
  accessToken?: string
) => {
  console.log('Creating Axios Instance:', { accessToken });

  const instance = Axios.create({});

  // 請求攔截器 - 加入認證 token
  instance.interceptors.request.use(
    (config) => {
      // 如果提供了 token 參數則使用，否則從 store 獲取
      const token = accessToken;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    (error) => {
      if (error.response && error.response.status === 401) {
        dispatch(authActions.login());
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

  return createAxiosInstance(dispatch, accessToken);
};
