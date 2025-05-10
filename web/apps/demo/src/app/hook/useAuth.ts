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
    dispatch(authActions.loadAccessToken());
  }, [dispatch]);

  return {
    accessToken,
    setAccessToken,
    clearAccessToken,
  };
};
