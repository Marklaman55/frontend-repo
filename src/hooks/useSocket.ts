import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

export const useSocket = (event?: string, callback?: (data: any) => void) => {
  const socket = getSocket();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    if (event && callback) {
      socket.on(event, callback);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      if (event && callback) {
        socket.off(event, callback);
      }
    };
  }, [event, callback, socket]);

  return { socket, isConnected };
};
