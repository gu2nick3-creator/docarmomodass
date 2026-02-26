import { Product } from '@/types';
import { request } from './api';

export const productService = {
  getAll(filters?: { categoryId?: string; subcategoryId?: string; search?: string }) {
    return request<Product[]>('/products', {
      params: {
        categoryId: filters?.categoryId || '',
        subcategoryId: filters?.subcategoryId || '',
        search: filters?.search || '',
      },
    });
  },

  getById(id: string) {
    return request<Product>(`/products/${id}`);
  },

  create(product: Omit<Product, 'id'>) {
    return request<Product>('/products', { method: 'POST', body: product });
  },

  update(id: string, product: Partial<Product>) {
    return request<Product>(`/products/${id}`, { method: 'PUT', body: product });
  },

  delete(id: string) {
    return request<void>(`/products/${id}`, { method: 'DELETE' });
  },
};
