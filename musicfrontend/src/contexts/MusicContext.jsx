import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { recommendationsAPI, searchAPI, playlistsAPI, handleApiError } from '../services/api';
import toast from 'react-hot-toast';

const MusicContext = createContext();

const initialState = {
  // Recommendations
  recommendations: [],
  currentRecommendations: [],
  isLoadingRecommendations: false,
  
  // Search
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  
  // Playlists
  currentPlaylist: null,
  savedPlaylists: [],
  playlistThemes: [],
  isLoadingPlaylist: false,
  
  // User interactions
  likedTracks: [],
  ratedTracks: [],
  
  // Context and filters
  currentContext: 'general',
  filters: {
    genre: '',
    yearFrom: '',
    yearTo: '',
    energyMin: '',
    energyMax: '',
    valenceMin: '',
    valenceMax: '',
  },
  
  // Error handling
  error: null,
};

const musicReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING_RECOMMENDATIONS':
      return {
        ...state,
        isLoadingRecommendations: action.payload,
      };
    case 'SET_LOADING_SEARCH':
      return {
        ...state,
        isSearching: action.payload,
      };
    case 'SET_LOADING_PLAYLIST':
      return {
        ...state,
        isLoadingPlaylist: action.payload,
      };
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload,
        currentRecommendations: action.payload,
        isLoadingRecommendations: false,
        error: null,
      };
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
        isSearching: false,
        error: null,
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };
    case 'SET_PLAYLIST':
      return {
        ...state,
        currentPlaylist: action.payload,
        isLoadingPlaylist: false,
        error: null,
      };
    case 'SET_SAVED_PLAYLISTS':
      return {
        ...state,
        savedPlaylists: action.payload,
      };
    case 'SET_PLAYLIST_THEMES':
      return {
        ...state,
        playlistThemes: action.payload,
      };
    case 'ADD_LIKED_TRACK':
      return {
        ...state,
        likedTracks: [...state.likedTracks, action.payload],
      };
    case 'ADD_RATED_TRACK':
      return {
        ...state,
        ratedTracks: [...state.ratedTracks, action.payload],
      };
    case 'SET_CONTEXT':
      return {
        ...state,
        currentContext: action.payload,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          genre: '',
          yearFrom: '',
          yearTo: '',
          energyMin: '',
          energyMax: '',
          valenceMin: '',
          valenceMax: '',
        },
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoadingRecommendations: false,
        isSearching: false,
        isLoadingPlaylist: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const MusicProvider = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);

  // Load playlist themes on mount
  useEffect(() => {
    loadPlaylistThemes();
  }, []);

  const loadPlaylistThemes = async () => {
    try {
      const response = await playlistsAPI.getThemes();
      dispatch({
        type: 'SET_PLAYLIST_THEMES',
        payload: response.data.data.themes,
      });
    } catch (error) {
      console.error('Error loading playlist themes:', error);
    }
  };

  const getRecommendations = async (context = 'general', limit = 20, useML = true) => {
    dispatch({ type: 'SET_LOADING_RECOMMENDATIONS', payload: true });
    dispatch({ type: 'SET_CONTEXT', payload: context });
    
    try {
      let response;
      
      if (useML) {
        // Use ML-powered recommendations
        response = await recommendationsAPI.getMLRecommendations({
          context,
          limit,
        });
      } else {
        // Use basic recommendations
        response = await recommendationsAPI.getInfiniteFeed({
          context,
          limit,
        });
      }
      
      dispatch({
        type: 'SET_RECOMMENDATIONS',
        payload: response.data.data.recommendations,
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorData = handleApiError(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorData.message,
      });
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  const searchTracks = async (query, type = 'all', limit = 20) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return { success: true, data: { results: [] } };
    }
    
    dispatch({ type: 'SET_LOADING_SEARCH', payload: true });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    
    try {
      const response = await searchAPI.search(query, { type, limit });
      
      dispatch({
        type: 'SET_SEARCH_RESULTS',
        payload: response.data.data.results,
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorData = handleApiError(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorData.message,
      });
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  const advancedSearch = async (filters) => {
    dispatch({ type: 'SET_LOADING_SEARCH', payload: true });
    
    try {
      const response = await searchAPI.advancedSearch(filters);
      
      dispatch({
        type: 'SET_SEARCH_RESULTS',
        payload: response.data.data.results,
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorData = handleApiError(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorData.message,
      });
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  const rateTrack = async (trackId, rating, context = 'general') => {
    try {
      const response = await recommendationsAPI.rateTrack({
        trackId,
        rating,
        context,
      });
      
      // Add to rated tracks
      dispatch({
        type: 'ADD_RATED_TRACK',
        payload: { trackId, rating, context, timestamp: new Date() },
      });
      
      toast.success(`Rated track ${rating}/5 stars!`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorData = handleApiError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  const likeTrack = (track) => {
    dispatch({
      type: 'ADD_LIKED_TRACK',
      payload: { ...track, timestamp: new Date() },
    });
    toast.success(`Added "${track.track_name}" to liked tracks!`);
  };

  const generatePlaylist = async (theme, numTracks = 20, context = 'general', includeUserPreferences = true) => {
    dispatch({ type: 'SET_LOADING_PLAYLIST', payload: true });
    
    try {
      const response = await playlistsAPI.generatePlaylist({
        theme,
        num_tracks: numTracks,
        context,
        include_user_preferences: includeUserPreferences,
      });
      
      dispatch({
        type: 'SET_PLAYLIST',
        payload: response.data.data.playlist,
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorData = handleApiError(error);
      dispatch({
        type: 'SET_ERROR',
        payload: errorData.message,
      });
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  const savePlaylist = async (name, description, tracks, theme) => {
    try {
      const response = await playlistsAPI.savePlaylist({
        name,
        description,
        tracks,
        theme,
      });
      
      // Refresh saved playlists
      loadSavedPlaylists();
      
      toast.success('Playlist saved successfully!');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorData = handleApiError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  const loadSavedPlaylists = async () => {
    try {
      const response = await playlistsAPI.getSavedPlaylists();
      dispatch({
        type: 'SET_SAVED_PLAYLISTS',
        payload: response.data.data.playlists,
      });
    } catch (error) {
      console.error('Error loading saved playlists:', error);
    }
  };

  const setFilters = (filters) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: filters,
    });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    getRecommendations,
    searchTracks,
    advancedSearch,
    rateTrack,
    likeTrack,
    generatePlaylist,
    savePlaylist,
    loadSavedPlaylists,
    setFilters,
    clearFilters,
    clearError,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export default MusicContext;
