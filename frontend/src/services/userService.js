import api from './api';

export async function getMe() {
  const res = await api.get('/users/me');
  return res.data;
}

export async function updateMe({ username, email, bio, isPrivate, profileImageFile } = {}) {
  const formData = new FormData();
  if (typeof username === 'string') formData.append('username', username);
  if (typeof email === 'string') formData.append('email', email);
  if (typeof bio === 'string') formData.append('bio', bio);
  if (typeof isPrivate !== 'undefined') formData.append('isPrivate', String(isPrivate));
  if (profileImageFile) formData.append('media', profileImageFile);

  const res = await api.patch('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getProfile(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data;
}

export async function follow(userId) {
  const res = await api.post(`/users/${userId}/follow`);
  return res.data;
}

export async function unfollow(userId) {
  const res = await api.post(`/users/${userId}/unfollow`);
  return res.data;
}

export async function getUserPosts(userId, { page = 1, limit = 20 } = {}) {
  const res = await api.get(`/users/${userId}/posts`, {
    params: { page, limit },
  });
  return res.data;
}

export async function followByNewApi(userId) {
  const res = await api.post(`/users/follow/${userId}`);
  return res.data;
}

export async function unfollowByNewApi(userId) {
  const res = await api.post(`/users/unfollow/${userId}`);
  return res.data;
}

export async function requestFollow(userId) {
  const res = await api.post(`/users/request/${userId}`);
  return res.data;
}

export async function acceptFollowRequest(userId) {
  const res = await api.post(`/users/accept/${userId}`);
  return res.data;
}

export async function rejectFollowRequest(userId) {
  const res = await api.post(`/users/reject/${userId}`);
  return res.data;
}

export async function getFollowers(userId) {
  const res = await api.get(`/users/followers/${userId}`);
  return res.data;
}

export async function getFollowing(userId) {
  const res = await api.get(`/users/following/${userId}`);
  return res.data;
}

export async function getFollowRequests() {
  const res = await api.get('/users/follow-requests');
  return res.data;
}

export async function getSuggestedUsers() {
  const res = await api.get('/users/suggested');
  return res.data;
}

