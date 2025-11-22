/**
 * Service API pour communiquer avec le backend
 * Gère les appels REST et WebSocket
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3333';

// Récupérer le token depuis localStorage
const getAuthToken = () => {
  return localStorage.getItem('api_token');
};

// Créer une instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalide ou expiré
      console.error('Authentication error');
      // Rediriger vers la page de configuration si nécessaire
    }
    return Promise.reject(error);
  }
);

/**
 * API Chat
 */
export const chatApi = {
  /**
   * Envoie un message au chat
   */
  sendMessage: async (sessionId, message, options = {}) => {
    const response = await apiClient.post('/api/chat/', {
      message,
      session_id: sessionId,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: false,
    });
    return response.data;
  },

  /**
   * Récupère l'historique d'une session
   */
  getSession: async (sessionId) => {
    const response = await apiClient.get(`/api/chat/${sessionId}`);
    return response.data;
  },

  /**
   * Supprime une session
   */
  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(`/api/chat/${sessionId}`);
    return response.data;
  },

  /**
   * Crée une connexion WebSocket pour le streaming
   */
  createWebSocket: (sessionId, onMessage, onError) => {
    const token = getAuthToken();
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/api/chat/ws/${sessionId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return ws;
  },
};

/**
 * API Utils (résumé, traduction, génération)
 */
export const utilsApi = {
  /**
   * Résume un contenu
   */
  summarize: async (sessionId, { text, url, maxLength = 500, language = 'fr' }) => {
    const response = await apiClient.post('/api/utils/summary', {
      text,
      url,
      session_id: sessionId,
      max_length: maxLength,
      language,
    });
    return response.data;
  },

  /**
   * Traduit un texte
   */
  translate: async (sessionId, text, targetLanguage, sourceLanguage = null) => {
    const response = await apiClient.post('/api/utils/translate', {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage,
      session_id: sessionId,
    });
    return response.data;
  },

  /**
   * Génère du contenu à partir d'un template
   */
  generate: async (sessionId, { templateId, customPrompt, context, temperature = 0.7 }) => {
    const response = await apiClient.post('/api/utils/generate', {
      template_id: templateId,
      custom_prompt: customPrompt,
      context,
      session_id: sessionId,
      temperature,
    });
    return response.data;
  },

  /**
   * Liste les templates disponibles
   */
  listTemplates: async () => {
    const response = await apiClient.get('/api/utils/templates');
    return response.data;
  },
};

/**
 * API Config
 */
export const configApi = {
  /**
   * Récupère la configuration
   */
  getConfig: async () => {
    const response = await apiClient.get('/api/config');
    return response.data;
  },

  /**
   * Met à jour la configuration
   */
  updateConfig: async (config) => {
    const response = await apiClient.post('/api/config', config);
    return response.data;
  },

  /**
   * Récupère l'historique des sessions
   */
  getHistory: async (limit = 50, offset = 0) => {
    const response = await apiClient.get('/api/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Vérifie l'état de santé du backend
   */
  healthCheck: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
};

/**
 * Récupère le token d'authentification
 */
export const getAuthTokenFromServer = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/token`);
    return response.data.token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    throw error;
  }
};

/**
 * Sauvegarde le token dans localStorage
 */
export const saveAuthToken = (token) => {
  localStorage.setItem('api_token', token);
};

export default {
  chat: chatApi,
  utils: utilsApi,
  config: configApi,
  getAuthTokenFromServer,
  saveAuthToken,
};
