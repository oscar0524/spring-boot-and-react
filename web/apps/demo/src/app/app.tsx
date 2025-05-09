import { useAuth } from './hook/useAuth';

export function App() {
  const { accessToken } = useAuth();
  return (
    <div>
      {accessToken}
      <button
        onClick={() => {
          fetch('http://localhost:8080/user/info', {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          }).then(async (response) => {
            console.log('Response:', await response.json());
          });
        }}
      >
        Login
      </button>
    </div>
  );
}

export default App;
