import { useAuth } from '@demo/shared/lib/auth';
import { Route, Routes } from 'react-router-dom';
import Home from './home';
import { useAxios } from '@demo/shared/lib/axios';
import { useEffect } from 'react';

export function App() {
  const axios = useAxios();
  const { logout } = useAuth();

  // useEffect(() => {
  //   const request = axios.requestWithAbort({
  //     url: 'http://localhost:8080/test/hello',
  //     method: 'GET',
  //   });

  //   const fetchData = async () => {
  //     try {
  //       const res = await request.request;
  //       console.log('res', res);
  //     } catch (err) {
  //       console.log('err', err);
  //     }
  //   };

  //   fetchData();

  //   return () => {
  //     request.abort();
  //   };
  // }, [axios]);

  return (
    <div>
      <button onClick={logout}>LogOut</button>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
