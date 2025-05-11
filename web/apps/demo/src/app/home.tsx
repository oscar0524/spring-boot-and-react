import { useAuth } from '@demo/shared/lib/auth';

export const Home = () => {
  const { accessToken } = useAuth();
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
      <p>{accessToken}</p>
    </div>
  );
};

export default Home;
