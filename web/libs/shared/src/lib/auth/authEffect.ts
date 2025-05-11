import { Action } from 'redux'; // 導入 Redux Action 類型
import { authActions, authSelectors } from './authSlice'; // 導入認證相關的 actions 和 selectors
import {
  catchError, // 處理錯誤情況
  filter, // 過濾操作符
  map, // 轉換數據操作符
  Observable, // RxJS Observable 類型
  of, // 創建簡單 Observable 的方法
  switchMap, // 切換到新 Observable 的操作符
  withLatestFrom, // 結合最新狀態的操作符
} from 'rxjs';
import { authEpicDependencies } from '.'; // 導入 Epic 依賴項
import { authService } from './authService';

/**
 * 登入 Epic
 * 處理登入動作，重定向到登入頁面
 */
const loginEpic = (action$: Observable<Action>) =>
  action$.pipe(
    filter(authActions.login.match), // 過濾出 login action
    map((action) => {
      // 重定向到登入頁面，並設置返回 URL
      authService.login();
      return authActions.emptyAction(); // 返回空操作避免狀態更新
    })
  );

/**
 * 登出 Epic
 * 處理登出動作，重定向到登出頁面
 */
const logoutEpic = (action$: Observable<Action>) =>
  action$.pipe(
    filter(authActions.logout.match), // 過濾出 logout action
    map((action) => {
      // 重定向到登出頁面，並設置返回 URL
      authService.logout();
      return authActions.emptyAction(); // 返回空操作避免狀態更新
    })
  );

/**
 * 加載認證信息 Epic
 * 基於當前 token 狀態決定下一步操作
 */
const loadAuthEpic = (action$: Observable<Action>, state$: Observable<any>) =>
  action$.pipe(
    filter(authActions.loadAccessToken.match), // 過濾出 loadAccessToken action
    withLatestFrom(state$), // 結合最新的 Redux 狀態
    map(([_, state]) => state), // 提取狀態
    map((state) => authSelectors.getAccessToken(state)), // 獲取訪問令牌
    map((accessToken) => {
      if (accessToken) {
        // 如果已有令牌，加載用戶信息
        return authActions.loadUserInfo();
      }

      // 否則，獲取新令牌
      return authActions.loadToken();
    })
  );

/**
 * 加載令牌 Epic
 * 從服務器獲取訪問令牌
 */
const loadTokenEpic = (action$: Observable<Action>) =>
  action$.pipe(
    filter(authActions.loadToken.match), // 過濾出 loadToken action
    switchMap(() =>
      authService.getToken().pipe(
        map((response) => {
          const accessToken = response.data.accessToken; // 提取訪問令牌

          return authActions.setAccessToken({ accessToken }); // 設置訪問令牌
        }),
        catchError((error) => {
          console.error('Error fetching access token:', error); // 記錄錯誤
          return of(authActions.login()); // 出錯時重定向到登入頁面
        })
      )
    )
  );

/**
 * 加載用戶信息 Epic
 * 使用訪問令牌獲取用戶資料
 */
const loadUserInfoEpic = (
  action$: Observable<Action>,
  state$: Observable<any>,
  { axios }: authEpicDependencies // 注入配置好的 axios 實例
) =>
  action$.pipe(
    filter(authActions.loadUserInfo.match), // 過濾出 loadUserInfo action
    switchMap(() => {
      return authService.getUserInfo(axios()).pipe(
        map((response) => {
          const userInfo = response.data; // 提取用戶信息

          return authActions.setUserName({ userName: userInfo.username }); // 設置用戶名
        }),
        catchError((error) => {
          console.error('Error fetching user info:', error); // 記錄錯誤
          return of(authActions.emptyAction()); // 返回空操作
        })
      );
    })
  );

/**
 * 設置訪問令牌後的處理 Epic
 * 當訪問令牌被設置後，自動加載用戶信息
 */
const setAccessTokenEpic = (
  action$: Observable<Action>,
  state$: Observable<any>
) =>
  action$.pipe(
    filter(authActions.setAccessToken.match), // 過濾出 setAccessToken action
    withLatestFrom(state$), // 結合最新的 Redux 狀態
    map(([_, state]) => state), // 提取狀態
    map((state) => authSelectors.getAccessToken(state)), // 獲取訪問令牌
    filter((accessToken) => !!accessToken), // 確保令牌存在
    map((action) => authActions.loadUserInfo()) // 加載用戶信息
  );

/**
 * 導出所有認證相關的 Epics
 * 這些 Epics 將被註冊到 Redux-Observable 中間件
 */
export const authEpic = [
  loginEpic,
  logoutEpic,
  loadAuthEpic,
  loadTokenEpic,
  loadUserInfoEpic,
  setAccessTokenEpic,
];

export default authEpic;
