import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const notifications = ref<any[]>([]);

  const connect = () => {
    if (socket.value?.connected) return;

    const authStore = useAuthStore();
    
    socket.value = io('http://localhost:3001', {
      auth: {
        token: authStore.token
      }
    });

    socket.value.on('connect', () => {
      connected.value = true;
      console.log('✅ Socket connected');

      // Join appropriate room based on role
      const user = authStore.user;
      if (user?.operator) {
        socket.value?.emit('join:operator', user.operator.id);
      }
      if (user?.roles.includes('Supervisor')) {
        socket.value?.emit('join:supervisor');
      }
      if (user?.roles.includes('HRD')) {
        socket.value?.emit('join:hrd');
      }
      if (user?.roles.includes('Manager')) {
        socket.value?.emit('join:manager');
      }
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('❌ Socket disconnected');
    });

    // Listen for merit events
    socket.value.on('merit:created', (data: any) => {
      addNotification('Merit Created', data, 'success');
    });

    socket.value.on('merit:approved', (data: any) => {
      addNotification('Merit Approved', data, 'success');
    });

    // Listen for misconduct events
    socket.value.on('misconduct:created', (data: any) => {
      addNotification('Misconduct Created', data, 'warning');
    });

    socket.value.on('misconduct:approved', (data: any) => {
      addNotification('Misconduct Recorded', data, 'error');
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  };

  const addNotification = (title: string, data: any, type: string) => {
    notifications.value.unshift({
      id: Date.now(),
      title,
      data,
      type,
      timestamp: new Date()
    });

    // Keep only last 50 notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }
  };

  const clearNotifications = () => {
    notifications.value = [];
  };

  return {
    socket,
    connected,
    notifications,
    connect,
    disconnect,
    clearNotifications
  };
});
