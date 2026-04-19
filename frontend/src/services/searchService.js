import api from './api';

export async function searchUsers(query) {
  const q = String(query || '').trim();
  if (!q) return { users: [] };
  const res = await api.get('/search', { params: { q } });
  return res.data;
}
