/**
 * Store global avec Zustand
 * Gère l'état de l'application (sessions, messages, config, etc.)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // État de l'authentification
      isAuthenticated: false,
      authToken: null,

      // Configuration
      config: null,

      // Session actuelle
      currentSessionId: null,
      currentSessionMessages: [],

      // Historique des sessions
      sessions: [],

      // État de chargement
      isLoading: false,
      error: null,

      // WebSocket
      ws: null,
      isStreaming: false,
      streamingMessage: '',

      // Actions - Authentification
      setAuthToken: (token) => {
        set({ authToken: token, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem('api_token', token);
        }
      },

      logout: () => {
        set({ authToken: null, isAuthenticated: false });
        localStorage.removeItem('api_token');
      },

      // Actions - Configuration
      setConfig: (config) => set({ config }),

      // Actions - Session
      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId, currentSessionMessages: [] });
      },

      addMessage: (message) => {
        set((state) => ({
          currentSessionMessages: [...state.currentSessionMessages, message],
        }));
      },

      setMessages: (messages) => {
        set({ currentSessionMessages: messages });
      },

      clearCurrentSession: () => {
        set({ currentSessionId: null, currentSessionMessages: [] });
      },

      // Actions - Historique
      setSessions: (sessions) => set({ sessions }),

      // Actions - WebSocket
      setWebSocket: (ws) => set({ ws }),

      closeWebSocket: () => {
        const { ws } = get();
        if (ws) {
          ws.close();
          set({ ws: null });
        }
      },

      setStreaming: (isStreaming) => set({ isStreaming }),

      setStreamingMessage: (message) => set({ streamingMessage: message }),

      appendStreamingMessage: (chunk) => {
        set((state) => ({
          streamingMessage: state.streamingMessage + chunk,
        }));
      },

      resetStreamingMessage: () => set({ streamingMessage: '' }),

      // Actions - Loading et erreurs
      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ai-assistant-storage',
      partialize: (state) => ({
        authToken: state.authToken,
        isAuthenticated: state.isAuthenticated,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

export default useStore;
