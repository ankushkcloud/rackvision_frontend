import axios, { AxiosError } from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('rv_token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

api.interceptors.response.use(r => r, (err: AxiosError) => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('rv_token');
    localStorage.removeItem('rv_user');
    if (!window.location.pathname.includes('/auth')) window.location.href = '/auth/login';
  }
  return Promise.reject(err);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) => api.post('/auth/login',    { email, password }),
  register: (name: string, email: string, password: string) => api.post('/auth/register', { name, email, password }),
  me:       () => api.get('/auth/me'),
};

// ─── Racks ────────────────────────────────────────────────────────────────────
export const rackApi = {
  list:           (params?: object)   => api.get('/racks',           { params }),
  get:            (id: string)        => api.get(`/racks/${id}`),
  getByToken:     (token: string)     => api.get(`/racks/share/${token}`),
  create:         (data: object)      => api.post('/racks',          data),
  update:         (id: string, d: object) => api.put(`/racks/${id}`, d),
  delete:         (id: string)        => api.delete(`/racks/${id}`),
  getDevices:     (id: string)        => api.get(`/racks/${id}/devices`),
};

// ─── Devices ──────────────────────────────────────────────────────────────────
export const deviceApi = {
  create:  (data: object)              => api.post('/devices',        data),
  get:     (id: string)                => api.get(`/devices/${id}`),
  update:  (id: string, data: object)  => api.put(`/devices/${id}`,   data),
  delete:  (id: string)                => api.delete(`/devices/${id}`),
  search:  (rackId: string, params?: object) => api.get(`/devices/search/${rackId}`, { params }),
};

// ─── Ports ────────────────────────────────────────────────────────────────────
export const portApi = {
  getAll:      (deviceId: string)                            => api.get(`/ports/${deviceId}`),
  updateOne:   (deviceId: string, portNum: number, d: object)=> api.put(`/ports/${deviceId}/${portNum}`, d),
  bulkUpdate:  (deviceId: string, ports: unknown[])          => api.put(`/ports/${deviceId}/bulk`, { ports }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  analyze: (rackId: string) => api.get(`/ai/analyze/${rackId}`),
};

export const alertsApi = {
  list:     (params?: object)                => api.get('/alerts', { params }),
  create:   (data: object)                   => api.post('/alerts', data),
  generate: (rackId: string)                 => api.post(`/alerts/generate/${rackId}`),
  ack:      (id: string)                     => api.put(`/alerts/${id}/acknowledge`),
  resolve:  (id: string)                     => api.put(`/alerts/${id}/resolve`),
  delete:   (id: string)                     => api.delete(`/alerts/${id}`),
};

export const healthApi = {
  get:      (deviceId: string)               => api.get(`/health/${deviceId}`),
  getRack:  (rackId: string)                 => api.get(`/health/rack/${rackId}`),
  update:   (deviceId: string, data: object) => api.post(`/health/${deviceId}`, data),
};

export const warrantyApi = {
  get:      (deviceId: string)               => api.get(`/warranty/${deviceId}`),
  getRack:  (rackId: string)                 => api.get(`/warranty/rack/${rackId}`),
  expiring: ()                               => api.get('/warranty/expiring/soon'),
  upsert:   (deviceId: string, data: object) => api.post(`/warranty/${deviceId}`, data),
};

export const auditApi = {
  list:     (params?: object)                => api.get('/audit', { params }),
  rack:     (rackId: string)                 => api.get(`/audit/rack/${rackId}`),
};

export const analyticsApi = {
  dashboard: ()                              => api.get('/analytics/dashboard'),
};

export const usersApi = {
  list: () => api.get('/users'),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
};

export const settingsApi = {
  branding: () => api.get('/settings/branding'),
  updateBranding: (data: object) => api.put('/settings/branding', data),
};

export const ticketsApi = {
  list: (params?: object) => api.get('/tickets', { params }),
  create: (data: object) => api.post('/tickets', data),
  update: (id: string, data: object) => api.put(`/tickets/${id}`, data),
};

export const supportApi = {
  list: (params?: object) => api.get('/support', { params }),
  create: (data: object) => api.post('/support', data),
  update: (id: string, data: object) => api.put(`/support/${id}`, data),
};

export const backupApi = {
  list: () => api.get('/backups'),
  create: (data: object) => api.post('/backups', data),
  restore: (id: string) => api.post(`/backups/${id}/restore`),
};

export const reportsApi = {
  preview: () => api.get('/reports/preview'),
  listSchedules: () => api.get('/reports/schedules'),
  createSchedule: (data: object) => api.post('/reports/schedules', data),
  updateSchedule: (id: string, data: object) => api.put(`/reports/schedules/${id}`, data),
};

export const discoveryApi = {
  list: () => api.get('/discovery'),
  run: (data: object) => api.post('/discovery/run', data),
  importFinding: (jobId: string, data: object) => api.post(`/discovery/${jobId}/import`, data),
};

export const monitoringApi = {
  ingest: (deviceId: string, data: object) => api.post(`/monitoring/ingest/${deviceId}`, data),
  history: (deviceId: string, params?: object) => api.get(`/monitoring/history/${deviceId}`, { params }),
};

export const slaApi = {
  overview: () => api.get('/sla/overview'),
};
