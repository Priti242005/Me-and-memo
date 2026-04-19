import api from './api';

export async function createHighlight(payload) {
  const res = await api.post('/highlights', payload);
  return res.data;
}

export async function getHighlights(userId) {
  const res = await api.get(`/highlights/${userId}`);
  return res.data;
}

export async function addStoryToHighlight(payload) {
  const res = await api.post('/highlights/add-story', payload);
  return res.data;
}
