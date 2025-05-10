// 導入必要的 React 相關庫和組件
import { StrictMode } from 'react'; // 導入 StrictMode，用於突顯應用程式中的潛在問題
import { BrowserRouter } from 'react-router-dom'; // 導入 BrowserRouter，用於路由管理
import * as ReactDOM from 'react-dom/client'; // 導入 ReactDOM 客戶端渲染 API
import App from './app/app'; // 導入根應用組件
import { Provider } from 'react-redux'; // 導入 Redux Provider，用於全局狀態管理
import { persistor, store } from './app/store/store'; // 導入 Redux store 和 persistor
import { PersistGate } from 'redux-persist/lib/integration/react'; // 導入 PersistGate，用於持久化狀態管理

// 創建 React 根元素，用於渲染整個應用
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement // 獲取 HTML 中的根元素
);

// 渲染整個應用程式
root.render(
  <StrictMode>
    {' '}
    {/* 啟用嚴格模式，幫助發現潛在問題 */}
    <Provider store={store}>
      {' '}
      {/* 提供 Redux store 給整個應用 */}
      <PersistGate loading={null} persistor={persistor}>
        {' '}
        {/* 配置 Redux 持久化，在加載持久化數據前顯示 loading 狀態（此處為 null） */}
        <BrowserRouter
          future={{
            /* 配置 React Router v7 的未來特性 */
            v7_startTransition: true, // 啟用 v7 路由轉換
            v7_relativeSplatPath: true, // 啟用 v7 相對路徑
          }}
        >
          <App /> {/* 渲染主應用組件 */}
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>
);
