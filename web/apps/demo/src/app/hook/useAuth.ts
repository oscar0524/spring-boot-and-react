import { useDispatch, useSelector } from 'react-redux';
import { authActions, authSelectors } from '../store/slice/auth/auth-slice';
import { useEffect } from 'react';

export const useAuth = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(authSelectors.getAccessToken);

  const setAccessToken = (accessToken: string) => {
    dispatch(authActions.setAccessToken({ accessToken }));
  };

  const clearAccessToken = () => {
    dispatch(authActions.clearAccessToken());
  };

  useEffect(() => {
    // 檢查 URL 是否包含 accessToken
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get('accessToken');

    if (tokenFromUrl) {
      // 清除 URL 中的 accessToken 參數
      searchParams.delete('accessToken');
      const newUrl = searchParams.toString()
        ? `${window.location.pathname}?${searchParams.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, document.title, newUrl);

      dispatch(authActions.setAccessToken({ accessToken: tokenFromUrl }));
      return;
    }
    dispatch(authActions.loadAccessToken());
  }, [dispatch, accessToken]);

  return {
    accessToken,
    setAccessToken,
    clearAccessToken,
  };
};
