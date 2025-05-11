import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authActions } from '.';

export const Auth = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch(); // 獲取 dispatch 函數用於發送 actions
  /**
   * 在組件掛載時，從持久化存儲中加載之前保存的 access token (如果有的話)
   */
  useEffect(() => {
    dispatch(authActions.loadAccessToken());
  }, [dispatch]);
  return children;
};
