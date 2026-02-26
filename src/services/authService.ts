import { request } from './api';

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export const authService = {
  async login(email: string, password: string) {
    const data = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('admin_auth', 'true');
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  getUser() {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  },
};
