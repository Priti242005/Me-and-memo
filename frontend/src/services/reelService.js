import api from './api';

export async function uploadReel({ caption, mediaFile }) {
  const formData = new FormData();
  if (caption) formData.append('caption', caption);
  formData.append('media', mediaFile);

  const res = await api.post('/reels', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function likeReel(reelId) {
  const res = await api.post(`/reels/${reelId}/like`);
  return res.data;
}

export async function commentReel(reelId, text) {
  const res = await api.post(`/reels/${reelId}/comments`, { text });
  return res.data;
}

export async function getReelsFeed({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/reels/feed', { params: { page, limit } });
  return res.data;
}

