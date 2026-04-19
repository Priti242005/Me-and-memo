import api from './api';
import { API_BASE_URL } from './api';

export async function register(payload) {
  // payload: { username, email, password, profilePic?, bio? }
  const res = await api.post('/auth/register', payload);
  return res.data;
}

export async function login(payload) {
  // payload: { email?, username?, password }
  const res = await api.post('/auth/login', payload);
  return res.data;
}

// New auth APIs (secure flows)
export async function signup(payload) {
  // payload: { name, username, email, password, profilePic?, bio? }
  const res = await api.post('/auth/signup', payload);
  return res.data;
}

export async function verifyEmail(payload) {
  // payload: { email, otp }
  const res = await api.post('/auth/verify-email', payload);
  return res.data;
}

export async function sendLoginOtp(email) {
  const res = await api.post('/auth/send-login-otp', { email });
  return res.data;
}

export async function verifyLoginOtp(payload) {
  // payload: { email, otp }
  const res = await api.post('/auth/verify-login-otp', payload);
  return res.data;
}

export async function forgotPassword(email) {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(payload) {
  // payload: { email, otp, newPassword }
  const res = await api.post('/auth/reset-password', payload);
  return res.data;
}

export function getGoogleAuthUrl() {
  // OAuth route is mounted at the API root (not under /api).
  return `${API_BASE_URL}/auth/google`;
}

