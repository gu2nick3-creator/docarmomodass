import { Order, OrderStatus } from '@/types';
import { request } from './api';

export const orderService = {
  getAll(filters?: { status?: string }) {
    return request<Order[]>('/orders', {
      params: { status: filters?.status || '' },
    });
  },

  getById(id: string) {
    return request<Order>(`/orders/${id}`);
  },

  create(order: Omit<Order, 'id' | 'createdAt'>) {
    return request<Order>('/orders', { method: 'POST', body: order });
  },

  updateStatus(id: string, status: OrderStatus) {
    return request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
  },
};
