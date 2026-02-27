import { Order, OrderStatus } from '@/types';
import { request } from './api';

function toApiStatus(status: OrderStatus): string {
  switch (status) {
    case 'Pendente':
      return 'pending';
    case 'Entregue':
      return 'delivered';
    case 'Cancelado':
      return 'canceled';
    case 'Finalizado':
      return 'finished';
    default:
      return 'pending';
  }
}

export const orderService = {
  // OBS: backend /orders (GET) está protegido com requireAuth
  getAll(filters?: { status?: string }) {
    // seu backend atual não filtra por query, mas pode ignorar sem problema
    return request<Order[]>('/orders', {
      params: { status: filters?.status || '' },
    });
  },

  // seu backend não tem GET /orders/:id (só /orders/:id/status)
  // então deixei comentado para não quebrar imports
  // getById(id: string) {
  //   return request<Order>(`/orders/${id}`);
  // },

  create(order: Omit<Order, 'id' | 'createdAt'>) {
    return request<Order>('/orders', { method: 'POST', body: order });
  },

  updateStatus(id: string, status: OrderStatus, payment_id?: string | null) {
    return request<{ ok: true }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status: toApiStatus(status), payment_id: payment_id ?? null },
    });
  },

  getStatus(id: string) {
    return request<{ id: number | string; status: string; payment_id: string | null }>(
      `/orders/${id}/status`,
    );
  },
};
