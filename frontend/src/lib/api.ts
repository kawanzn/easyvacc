export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const validation = data?.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(String(validation || data?.mensagem || data?.message || `Erro HTTP ${response.status}`));
  }
  return data as T;
}
