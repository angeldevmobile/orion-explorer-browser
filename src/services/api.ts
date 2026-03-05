import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string | null;
  createdAt: string;
  userId: string;
}

export interface Favorite {
  id: string;
  url: string;
  title: string;
  icon?: string | null;
  createdAt: string;
  userId: string;
}

export interface History {
  id: string;
  url: string;
  title: string;
  timestamp: string;
  userId: string;
}

export interface VoiceQueryResponse {
  success: boolean;
  action: 'search' | 'navigate' | 'info' | 'command' | 'chat';
  url?: string;
  query?: string;
  response: string;
  suggestions: string[];
  data?: {
    intent: string;
    confidence: 'alta' | 'media' | 'baja';
  };
}

export interface PageSummary {
  success: boolean;
  summary: string;
  keyPoints: string[];
  suggestions: string[];
  sentiment: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  canHelpWith?: string[];
}

// Auth Services
export const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Tab Services
export const tabService = {
  getTabs: async (): Promise<Tab[]> => {
    const response = await api.get('/tabs');
    return response.data.data;
  },

  createTab: async (data: { url: string; title: string; favicon?: string }) => {
    const response = await api.post('/tabs', data);
    return response.data.data;
  },

  updateTab: async (id: string, data: { url?: string; title?: string; favicon?: string }) => {
    const response = await api.put(`/tabs/${id}`, data);
    return response.data.data;
  },

  deleteTab: async (id: string) => {
    const response = await api.delete(`/tabs/${id}`);
    return response.data;
  },
};

// Favorite Services
export const favoriteService = {
  getFavorites: async (): Promise<Favorite[]> => {
    const response = await api.get('/favorites');
    return response.data.data;
  },

  addFavorite: async (data: { url: string; title: string; icon?: string }) => {
    const response = await api.post('/favorites', data);
    return response.data.data;
  },

  deleteFavorite: async (id: string) => {
    const response = await api.delete(`/favorites/${id}`);
    return response.data;
  },
};

// History Services
export const historyService = {
  getHistory: async (search?: string, limit?: number): Promise<History[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/history?${params.toString()}`);
    return response.data.data;
  },

  addHistory: async (data: { url: string; title: string }) => {
    const response = await api.post('/history', data);
    return response.data.data;
  },

  deleteHistory: async (id: string) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete('/history');
    return response.data;
  },
};

// Voice & AI Services
export const voiceService = {
  processVoiceCommand: async (query: string, context?: Record<string, unknown>): Promise<VoiceQueryResponse> => {
    const response = await api.post('/voice/process', { query, context });
    return response.data;
  },

  summarizePage: async (url: string, content: string): Promise<PageSummary> => {
    const response = await api.post('/voice/summarize', { url, content });
    return response.data;
  },

  chat: async (message: string): Promise<ChatResponse> => {
    const response = await api.post('/voice/chat', { message });
    return response.data;
  },

  getSuggestions: async (currentUrl: string, userActivity: Record<string, unknown>) => {
    const response = await api.post('/voice/suggestions', { currentUrl, userActivity });
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.post('/voice/clear-history');
    return response.data;
  },
};

// ── Quick Notes ──
export const notesService = {
  getAll: async () => {
    const response = await api.get('/notes');
    return response.data.data;
  },

  create: async (data: { text: string; url: string; color: string }) => {
    const response = await api.post('/notes', data);
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
};

// ── Quick Tasks ──
export const tasksService = {
  getAll: async () => {
    const response = await api.get('/tasks');
    return response.data.data;
  },

  create: async (text: string) => {
    const response = await api.post('/tasks', { text });
    return response.data.data;
  },

  toggle: async (id: string) => {
    const response = await api.patch(`/tasks/${id}/toggle`);
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

// ── Focus Mode ──
export const focusService = {
  getBlockedSites: async () => {
    const response = await api.get('/focus/blocked-sites');
    return response.data.data;
  },

  addBlockedSite: async (domain: string) => {
    const response = await api.post('/focus/blocked-sites', { domain });
    return response.data.data;
  },

  removeBlockedSite: async (id: string) => {
    const response = await api.delete(`/focus/blocked-sites/${id}`);
    return response.data;
  },

  startSession: async (durationMs: number) => {
    const response = await api.post('/focus/sessions', { durationMs });
    return response.data.data;
  },

  endSession: async (id: string, elapsedMs: number, completed: boolean) => {
    const response = await api.patch(`/focus/sessions/${id}/end`, { elapsedMs, completed });
    return response.data;
  },
};

// ── Browsing Stats ──
export const statsService = {
  getToday: async () => {
    const response = await api.get('/stats/today');
    return response.data.data;
  },

  recordVisit: async (domain: string, minutes?: number) => {
    const response = await api.post('/stats/visit', { domain, minutes });
    return response.data;
  },
};

// ── User Preferences ──
export const preferencesService = {
  get: async () => {
    const response = await api.get('/preferences');
    return response.data.data;
  },

  update: async (data: Record<string, unknown>) => {
    const response = await api.patch('/preferences', data);
    return response.data.data;
  },
};

export default api;