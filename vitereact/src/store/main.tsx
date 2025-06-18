import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Interfaces for Types
export interface UserType {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AuthType {
  token: string;
  user: UserType;
  is_authenticated: boolean;
}

export interface NotificationType {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export interface UserSettingsType {
  dashboard_preferences: Record<string, any>;
  notification_settings: Record<string, any>;
  configuration: Record<string, any>;
}

export interface GlobalState {
  auth: AuthType;
  notifications: NotificationType[];
  user_settings: UserSettingsType;
  socket: Socket | null;
  // Actions
  set_auth: (new_auth: AuthType) => void;
  reset_auth: () => void;
  add_notification: (notification: NotificationType) => void;
  remove_notification: (id: string) => void;
  clear_notifications: () => void;
  update_user_settings: (settings: Partial<UserSettingsType>) => void;
  init_socket: () => Promise<void>;
  disconnect_socket: () => void;
}

export const useAppStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // Global state defaults using snake_case
      auth: {
        token: "",
        user: {
          id: "",
          username: "",
          email: "",
          role: "",
          created_at: "",
          updated_at: ""
        },
        is_authenticated: false
      },
      notifications: [],
      user_settings: {
        dashboard_preferences: {},
        notification_settings: {},
        configuration: {}
      },
      socket: null,
      // Actions to handle global state changes
      set_auth: (new_auth: AuthType) => set({ auth: new_auth }),
      reset_auth: () =>
        set({
          auth: {
            token: "",
            user: {
              id: "",
              username: "",
              email: "",
              role: "",
              created_at: "",
              updated_at: ""
            },
            is_authenticated: false
          }
        }),
      add_notification: (notification: NotificationType) =>
        set((state) => ({
          notifications: [...state.notifications, notification]
        })),
      remove_notification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id)
        })),
      clear_notifications: () => set({ notifications: [] }),
      update_user_settings: (settings: Partial<UserSettingsType>) =>
        set((state) => ({
          user_settings: { ...state.user_settings, ...settings }
        })),
      // Initialize socket connection and subscribe to realtime events (e.g., new notifications)
      init_socket: async () => {
        if (get().socket) return; // Prevent multiple socket connections
        try {
          const base_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
          const socket = io(base_url, { transports: ['websocket'] });
          // Listen for realtime 'notification' event from backend
          socket.on('notification', (data: NotificationType) => {
            get().add_notification(data);
          });
          set({ socket });
        } catch (error) {
          console.error("Socket initialization error:", error);
        }
      },
      disconnect_socket: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      }
    }),
    {
      name: 'estatehub-storage', // Key in localStorage
      whitelist: ['auth', 'notifications', 'user_settings'] // Only persist these keys
    }
  )
);