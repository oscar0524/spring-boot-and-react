import Axios from 'axios-observable';

export function login() {
  document.location.href = `http://localhost:8080/form/login?username=oscar&redirect=${window.location}`;
}

export function logout() {
  document.location.href = `http://localhost:8080/form/logout?redirect=${window.location}`;
}

export function getToken() {
  return Axios.get('http://localhost:8080/form/token', {
    withCredentials: true, // 包含憑證（如 cookies）
  });
}

export function refreshToken(refreshToken: string) {
  return Axios.get('http://localhost:8080/user/token', {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });
}

export function getUserInfo(axios: Axios) {
  return axios.get('http://localhost:8080/user/info');
}

export const authService = {
  login,
  logout,
  getToken,
  refreshToken,
  getUserInfo,
};
