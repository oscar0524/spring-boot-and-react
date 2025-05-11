import Axios from 'axios-observable';

export * from './authSlice';
export * from './authEffect';
export * from './useAuth';
export * from './authService';

/**
 * Auth Epic 依賴類型
 */
export type authEpicDependencies = {
  axios: () => Axios;
};
