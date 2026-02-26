import { Category } from '@/types';
import { request } from './api';

export const categoryService = {
  getAll() {
    return request<Category[]>('/categories');
  },

  getById(id: string) {
    return request<Category>(`/categories/${id}`);
  },

  create(category: { name: string }) {
    return request<Category>('/categories', { method: 'POST', body: category });
  },

  update(id: string, data: Partial<Category>) {
    return request<Category>(`/categories/${id}`, { method: 'PUT', body: data });
  },

  delete(id: string) {
    return request<void>(`/categories/${id}`, { method: 'DELETE' });
  },
};
