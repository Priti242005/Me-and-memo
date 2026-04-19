import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { API_BASE_URL } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Real-time notifications via Socket.io.
 * Backend emits: `notification` to room `user:<userId>`.
 */
export function useNotificationsSocket() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return notifications;
}

