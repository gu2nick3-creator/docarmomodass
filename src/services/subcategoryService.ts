import { Subcategory } from '@/types';
import { request } from './api';

export const subcategoryService = {
  getAll(categoryId?: string) {
    return request<Subcategory[]>('/subcategories', {
      params: { categoryId: categoryId || '' },
    });
  },

  create(subcategory: { name: string; categoryId: string }) {
    return request<Subcategory>('/subcategories', { method: 'POST', body: subcategory });
  },

  update(id: string, data: Partial<Subcategory>) {
    return request<Subcategory>(`/subcategories/${id}`, { method: 'PUT', body: data });
  },

  delete(id: string) {
    return request<void>(`/subcategories/${id}`, { method: 'DELETE' });
  },
};
