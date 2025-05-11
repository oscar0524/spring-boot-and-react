import { useDispatch, useSelector } from 'react-redux'; // 從 react-redux 導入 hooks 用於操作 Redux store
import { authActions, authSelectors } from './authSlice'; // 導入認證相關的 actions 和 selectors
import { useEffect } from 'react'; // 導入 useEffect 處理副作用

/**
 * 自定義 Hook：用於處理認證相關功能
 * 提供存取、設定與清除 access token 的方法
 */
export const useAuth = () => {
  const dispatch = useDispatch(); // 獲取 dispatch 函數用於發送 actions

  const accessToken = useSelector(authSelectors.getAccessToken); // 獲取當前的 access token
  const userName = useSelector(authSelectors.getUserName); // 獲取當前的用戶名稱

  /**
   * 在組件掛載時，從持久化存儲中加載之前保存的 access token (如果有的話)
   */
  useEffect(() => {
    dispatch(authActions.loadAccessToken());
  }, [dispatch]);

  function login() {
    // 登入方法，觸發登入 action
    dispatch(authActions.login());
  }

  function logout() {
    // 登出方法，觸發登出 action
    dispatch(authActions.logout());
  }

  // 返回認證相關的狀態和方法供組件使用
  return {
    accessToken,
    userName,
    login,
    logout,
  };
};
