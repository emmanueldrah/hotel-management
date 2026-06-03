import { api } from './api';
import type { ApiResponse, PaginationMeta } from '@/types';

export async function fetchList<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<{ items: T[]; meta?: PaginationMeta }> {
  const res = await api.get<ApiResponse<T[]>>(path, { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function fetchOne<T>(path: string): Promise<T> {
  const res = await api.get<ApiResponse<T>>(path);
  return res.data.data;
}
