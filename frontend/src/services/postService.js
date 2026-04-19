import api from './api';

export async function createPost({
  caption,
  mediaFile,
  unlockDate,
  unlockTime,
  unlockAmPm,
} = {}) {
  const formData = new FormData();
  if (caption) formData.append('caption', caption);
  formData.append('media', mediaFile);
  if (unlockDate) formData.append('unlockDate', unlockDate);
  if (unlockTime) formData.append('unlockTime', unlockTime);
  if (unlockAmPm) formData.append('unlockAmPm', unlockAmPm);

  const res = await api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** POST /api/captions/generate — returns { captions: string[] } */
export async function generateCaptions(topic) {
  const res = await api.post('/captions/generate', { topic });
  return res.data;
}

export async function getFeed({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/posts/feed', { params: { page, limit } });
  return res.data;
}

export async function likePost(postId) {
  const res = await api.post(`/posts/${postId}/like`);
  return res.data;
}

export async function unlikePost(postId) {
  const res = await api.post(`/posts/${postId}/unlike`);
  return res.data;
}

export async function commentPost(postId, text) {
  const res = await api.post(`/posts/${postId}/comments`, { text });
  return res.data;
}

export async function addCollaborators(postId, collaboratorUsernames) {
  // collaboratorUsernames can be comma-separated string or string[]
  const res = await api.post(`/posts/${postId}/collaborators`, {
    collaboratorUsernames,
  });
  return res.data;
}

export async function deletePost(postId) {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
}

export async function getPostLikes(postId) {
  const res = await api.get(`/posts/${postId}/likes`);
  return res.data;
}

export async function getPostComments(postId) {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data;
}

export async function getCollabRequests() {
  const res = await api.get('/posts/collab-requests');
  return res.data;
}

export async function acceptCollaboration(postId) {
  const res = await api.post(`/posts/${postId}/collab/accept`);
  return res.data;
}

export async function rejectCollaboration(postId) {
  const res = await api.post(`/posts/${postId}/collab/reject`);
  return res.data;
}

