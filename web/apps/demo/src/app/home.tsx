import { useAuth } from '@demo/shared/lib/auth';
import { useAxios } from '@demo/shared/lib/axios';
import { useState, useEffect, useRef } from 'react';

export const Home = () => {
  const { accessToken } = useAuth();
  const axiosInstance = useAxios();
  const abortControllerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 組件卸載時取消請求
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current();
      }
    };
  }, []);

  const handleFetchData = async () => {
    // 如果有上一個請求，先取消它
    if (abortControllerRef.current) {
      abortControllerRef.current();
    }

    // 發送請求
    const { request, abort } = axiosInstance.requestWithAbort({
      url: 'http://localhost:8080/user/hello',
      method: 'GET',
    });

    // 保存取消函數
    abortControllerRef.current = abort;

    try {
      const response = await request;
      // 處理成功回應
      console.log('Response data:', response.data);
    } catch (error) {
      // 處理錯誤
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
      <p>{accessToken}</p>
      <p>
        <button onClick={handleFetchData}>test get userinfo</button>
      </p>
    </div>
  );
};

export default Home;
