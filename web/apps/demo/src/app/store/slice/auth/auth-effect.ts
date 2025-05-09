import { Action } from 'redux';
import { authActions, authSelectors } from './auth-slice';
import {
  catchError,
  filter,
  map,
  Observable,
  of,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { EpicDependencies } from '../../store';

const loginEpic = (action$: Observable<Action>) =>
  action$.pipe(
    filter(authActions.login.match),
    map((action) => {
      document.location.href = `http://localhost:8080/user/login?username=oscar&redirect=${window.location}`;
      return authActions.emptyAction();
    })
  );

const loadAuthEpic = (action$: Observable<Action>, state$: Observable<any>) =>
  action$.pipe(
    filter(authActions.loadAccessToken.match),
    withLatestFrom(state$),
    map(([_, state]) => {
      const accessToken = authSelectors.getAccessToken(state);
      console.log('Loaded Access Token:', accessToken);
      if (accessToken) {
        // Perform any action with the loaded access token
        console.log('Access Token is available:', accessToken);
        return authActions.loadUserInfo();
      }
      console.log('No Access Token found');
      return authActions.login();
    })
  );

const loadUserInfoEpic = (
  action$: Observable<Action>,
  state$: Observable<any>,
  { axios }: EpicDependencies
) =>
  action$.pipe(
    filter(authActions.loadUserInfo.match),
    switchMap(() => {
      const _axios = axios();
      console.log('Axios Instance:', _axios);
      return _axios.get('http://localhost:8080/user/info').pipe(
        map((response) => {
          const userInfo = response.data;
          console.log('User Info:', userInfo);
          return authActions.setUserName({ userName: userInfo.username });
        }),
        catchError((error) => {
          console.error('Error fetching user info:', error);
          return of(authActions.emptyAction());
        })
      );
    })
  );

const setAccessTokenEpic = (action$: Observable<Action>) =>
  action$.pipe(
    filter(authActions.setAccessToken.match),
    map((action) => {
      const { accessToken } = action.payload;
      console.log('Access Token:', accessToken);
      return authActions.emptyAction();
    })
  );

export const authEpic = [
  loginEpic,
  loadAuthEpic,
  loadUserInfoEpic,
  setAccessTokenEpic,
];
