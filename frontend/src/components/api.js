import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:9090',
});

let token = localStorage.getItem('token') || '';
export const setToken = (t) => {
  token = t || '';
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
};

// Token validation utility
export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('roles');
  setToken('');
};

api.interceptors.request.use(cfg => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearAuthData();
      window.location.href = '/cms/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password });
  const { token: tk, username: u, roles } = res.data;
  setToken(tk);
  return { token: tk, username: u, roles };
};
export const getSession = async () => (await api.get('/api/auth/me')).data;

// Posts
export const fetchPosts = async ({ page = 0, size = 5, q = '', language } = {}) => {
  const res = await api.get('/api/posts', { params: { page, size, q, language } });
  return res.data;
};
export const fetchPostsByCategory = async ({ page = 0, size = 10, category, language } = {}) => {
  const params = { page, size, category };
  if (language === 'en') params.lang = 'en';
  const res = await api.get('/api/posts', { params });
  return res.data;
};
export const getPost = async (id) => (await api.get(`/api/posts/${id}`)).data;
export const getAbout = async (lang) => (await api.get('/api/posts/about', { params: { lang } })).data;
export const createPost = (payload) => api.post('/api/posts', payload).then(r => r.data);
export const updatePost = (id, payload) => api.put(`/api/posts/${id}`, payload).then(r => r.data);
export const deletePost = (id) => api.delete(`/api/posts/${id}`);

// Admin Users
export const adminCreateManager = async (payload) => (await api.post('/api/admin/users', payload)).data;
export const adminUpdateManager = async (id, payload) => (await api.put(`/api/admin/users/${id}`, payload)).data;
export const adminDeleteUser = async (id) => await api.delete(`/api/admin/users/${id}`);
export const adminListUsers = async ({ page = 0, size = 10, q = '' } = {}) => (await api.get('/api/admin/users', { params: { page, size, q } })).data;
export const adminGetUser = async (id) => (await api.get(`/api/admin/users/${id}`)).data;

// Current user profile
export const getMe = async () => (await api.get('/api/users/profile')).data;
export const updateMe = async (payload) => (await api.put('/api/users/profile', payload)).data;
export const changeMyPassword = async (payload) => (await api.put('/api/users/change-password', payload)).data;

// Images
export const fetchImages = async ({ ethnic, search = '', language, page = 0, size = 10 } = {}) => (
  await api.get('/api/images', { params: { ethnic, search, language, page, size } })
).data;
export const getImage = async (id) => (await api.get(`/api/images/${id}`)).data;
export const updateImage = async (id, payload) => (await api.put(`/api/images/${id}`, payload)).data;
export const deleteImage = async (id) => (await api.delete(`/api/images/${id}`)).data;
export const deleteImagesBulk = async (ids) => (await api.delete('/api/images/bulk', { data: ids })).data;
export const uploadImage = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/api/images/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};
export const uploadImages = async (files) => {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const res = await api.post('/api/images/upload/multiple', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

// Google Drive
export const get3dImages = async ({ page = 0, size = 10 } = {}) => (
  await api.get('/api/ggdrive/3d-images', { params: { page, size } })
).data;

export const get360Images = async ({ page = 0, size = 10 } = {}) => (
  await api.get('/api/ggdrive/360-images', { params: { page, size } })
).data;

export const getListVideoMp4 = async ({ page = 0, size = 10 } = {}) => (
  await api.get('/api/videos', { params: { page, size } })
).data;

export default api;
