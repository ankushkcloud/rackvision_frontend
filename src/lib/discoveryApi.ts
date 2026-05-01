// ============================================================
// FILE: frontend/src/lib/api.ts
// ACTION: PASTE THIS AT THE BOTTOM of your existing api.ts file
// ============================================================
import { api } from './api';

export const discoveryApi = {
  /** Check if nmap is installed on the backend server */
  checkStatus: () =>
    api.get('/discovery/status'),

  /** Start scan — returns sessionId immediately (scan runs in background) */
  startScan: (data: {
    networkRange: string;
    rackId?:      string;
    scanType?:    'ping_sweep' | 'port_scan';
    timeout?:     number;
    portScan?:    boolean;
    ports?:       string;
  }) => api.post('/discovery/scan', data),

  /** Poll scan progress — call every 1.5s while running */
  poll: (sessionId: string) =>
    api.get(`/discovery/session/${sessionId}/poll`),

  /** Get full session result with all discovered devices */
  getSession: (sessionId: string) =>
    api.get(`/discovery/session/${sessionId}`),

  /** List recent scan sessions */
  listSessions: (params?: { rackId?: string; limit?: number }) =>
    api.get('/discovery/sessions', { params }),

  /** Import one discovered device */
  importOne: (sessionId: string, data: {
    deviceIndex:  number;
    rackId:       string;
    uStart:       number;
    uSize?:       number;
    overrides?:   { name?: string; deviceType?: string; ipAddress?: string };
  }) => api.post(`/discovery/session/${sessionId}/import`, data),

  /** Import multiple discovered devices */
  importBulk: (sessionId: string, imports: {
    deviceIndex: number;
    rackId:      string;
    uStart:      number;
    uSize?:      number;
    overrides?:  { name?: string; deviceType?: string };
  }[]) => api.post(`/discovery/session/${sessionId}/import-bulk`, { imports }),

  /** Delete a scan session */
  deleteSession: (sessionId: string) =>
    api.delete(`/discovery/session/${sessionId}`),
};
