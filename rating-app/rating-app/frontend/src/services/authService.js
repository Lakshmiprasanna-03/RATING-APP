import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updatePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/update-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async getUsers(search = '', sortBy = 'name', sortOrder = 'ASC') {
    const response = await api.get(
      `/auth/users?search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  async deleteUser(userId) {
    await api.delete(`/auth/users/${userId}`);
  },
};

export default authService;
