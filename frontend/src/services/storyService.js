import api from './api';

/**
 * @param {File} mediaFile
 * @param {{ caption?: string, overlayText?: string, audience?: 'public'|'close_friends' }} [meta]
 */
export async function createStory(mediaFile, meta = {}) {
  const formData = new FormData();
  formData.append('media', mediaFile);
  if (meta.caption != null) formData.append('caption', String(meta.caption));
  if (meta.overlayText != null) formData.append('overlayText', String(meta.overlayText));
  if (meta.audience) formData.append('audience', meta.audience);

  const res = await api.post('/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** Grouped feed: { groups: [{ user, stories }] } */
export async function getStories() {
  const res = await api.get('/stories');
  return res.data;
}

export async function getMyStories() {
  const res = await api.get('/stories/me');
  return res.data;
}

export async function getStoriesByUser(userId) {
  const res = await api.get(`/stories/user/${userId}`);
  return res.data;
}

export async function recordStoryView(storyId) {
  const res = await api.post(`/stories/${storyId}/view`);
  return res.data;
}

export async function getStoryViewers(storyId) {
  const res = await api.get(`/stories/${storyId}/viewers`);
  return res.data;
}
