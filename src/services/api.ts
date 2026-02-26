// ============================================================
// API Base Config
// ============================================================

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, ''); // remove trailing "/"

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
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

function buildUrl(endpoint: string, params?: RequestOptions['params']) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (filtered.length) {
      const search = new URLSearchParams(filtered.map(([k, v]) => [k, String(v)]));
      url += `?${search.toString()}`;
    }
  }

  return url;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, ...rest } = options;

  const url = buildUrl(endpoint, params);

  const config: RequestInit = {
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
      ...(headers as Record<string, string>),
    },
    ...rest,
  };

  if (body !== undefined) config.body = JSON.stringify(body);

  const response = await fetch(url, config);

  // tenta ler JSON se vier
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

  if (!response.ok) {
    const msg =
      (isJson && (data as any)?.message) ||
      (typeof data === 'string' && data) ||
      `Erro ${response.status}`;
    const details = isJson ? (data as any)?.details ?? data : data;
    throw new ApiError(msg, response.status, details);
  }

  if (response.status === 204) return undefined as T;
  return (isJson ? data : (data as any)) as T;
}
