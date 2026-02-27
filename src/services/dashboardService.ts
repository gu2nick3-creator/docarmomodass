import { request } from './api';

export type DashboardMetrics = {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  pendingOrders: number;
  statusCounts: Record<string, number>;
};

export const dashboardService = {
  getMetrics() {
    return request<DashboardMetrics>('/dashboard/metrics');
  },
};
