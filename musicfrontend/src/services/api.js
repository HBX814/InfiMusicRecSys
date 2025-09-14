import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  deleteAccount: () => api.delete('/auth/account'),
};

// Recommendations API
export const recommendationsAPI = {
  getInfiniteFeed: (params = {}) => api.get('/recommendations/infinite-feed', { params }),
  getSimilarTracks: (trackId, limit = 10) => 
    api.get(`/recommendations/similar/${trackId}`, { params: { limit } }),
  rateTrack: (trackData) => api.post('/recommendations/rate', trackData),
  getContextRecommendations: (context, limit = 20) => 
    api.get(`/recommendations/context/${context}`, { params: { limit } }),
  getMLRecommendations: (data) => api.post('/recommendations/ml-recommendations', data),
  getTrendingTracks: (params = {}) => api.get('/recommendations/trending', { params }),
  searchSpotify: (params = {}) => api.get('/recommendations/spotify-search', { params }),
};

// Search API
export const searchAPI = {
  search: (query, params = {}) => api.get('/search', { params: { q: query, ...params } }),
  advancedSearch: (filters) => api.get('/search/advanced', { params: filters }),
  getSuggestions: (query, limit = 10) => 
    api.get('/search/suggestions', { params: { q: query, limit } }),
  getTrending: (params = {}) => api.get('/search/trending', { params }),
};

// Analytics API
export const analyticsAPI = {
  getInsights: () => api.get('/analytics/insights'),
  getListeningHistory: (params = {}) => api.get('/analytics/listening-history', { params }),
  getTasteProfile: () => api.get('/analytics/taste-profile'),
  getRecommendationAccuracy: () => api.get('/analytics/recommendation-accuracy'),
  getGlobalStats: () => api.get('/analytics/global-stats'),
};

// Playlists API
export const playlistsAPI = {
  generatePlaylist: (playlistData) => api.post('/playlists/generate', playlistData),
  getThemes: () => api.get('/playlists/themes'),
  savePlaylist: (playlistData) => api.post('/playlists/save', playlistData),
  getSavedPlaylists: () => api.get('/playlists/saved'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  getListeningHistory: (params = {}) => api.get('/users/listening-history', { params }),
  removeHistoryEntry: (entryId) => api.delete(`/users/listening-history/${entryId}`),
  clearHistory: () => api.post('/users/clear-history'),
  getStats: () => api.get('/users/stats'),
  exportData: () => api.post('/users/export-data'),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

export default api;
