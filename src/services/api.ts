// ============================================================
// API Base Config
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string>;
  body?: unknown;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const filtered = Object.entries(params).filter(([, v]) => v);
    if (filtered.length) url += `?${new URLSearchParams(filtered).toString()}`;
  }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(headers as Record<string, string>),
    },
    ...rest,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.message || `Erro ${response.status}`,
      response.status,
      errorData?.details || errorData,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export { API_BASE_URL };
