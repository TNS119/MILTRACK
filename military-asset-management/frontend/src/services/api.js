import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send secure cookies automatically
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const assetsAPI = {
  getDashboard: (params) => api.get('/assets/dashboard', { params }),
  checkStock: (baseId, equipmentTypeId) => api.get('/assets/stock', { params: { baseId, equipmentTypeId } }),
  getInventory: (params) => api.get('/assets/inventory', { params }),
};

export const purchasesAPI = {
  create: (data) => api.post('/purchases', data),
  getAll: (params) => api.get('/purchases', { params }),
};

export const transfersAPI = {
  create: (data) => api.post('/transfers', data),
  getAll: (params) => api.get('/transfers', { params }),
};

export const assignmentsAPI = {
  create: (data) => api.post('/assignments', data),
  getAll: (params) => api.get('/assignments', { params }),
};

export const expendituresAPI = {
  create: (data) => api.post('/expenditures', data),
  getAll: (params) => api.get('/expenditures', { params }),
};

export const lookupsAPI = {
  getBases: () => api.get('/bases'),
  getEquipmentTypes: (category) => api.get('/equipment-types', { params: { category } }),
};

export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

export default api;
