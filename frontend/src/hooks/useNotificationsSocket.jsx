import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { API_BASE_URL } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Real-time notifications via Socket.io.
 * Backend emits: `notification` to room `user:<userId>`.
 */
export function useNotificationsSocket() {
  const { token, user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user || loading) return undefined;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
      timeout: 10000,
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    socket.on('connect_error', () => {
      // Avoid noisy console spam if the backend socket endpoint is waking up.
    });

    return () => {
      socket.off('notification');
      socket.off('connect_error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, loading]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [token]);

  return notifications;
}
