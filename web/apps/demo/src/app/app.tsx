import { useDispatch } from 'react-redux';
import { useAuth } from './hook/useAuth';
import { authActions } from './store/slice/auth/auth-slice';

export function App() {
  const dispatch = useDispatch();
  const { accessToken } = useAuth();
  return (
    <div>
      {accessToken}
      <button
        onClick={() => {
          dispatch(authActions.logout());
        }}
      >
        LogOut
      </button>
    </div>
  );
}

export default App;
