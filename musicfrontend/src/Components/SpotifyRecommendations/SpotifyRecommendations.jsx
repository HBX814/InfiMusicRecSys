import React, { useState, useEffect } from 'react';
import { useMusic } from '../../contexts/MusicContext';
import { recommendationsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Play, 
  Pause, 
  Heart, 
  ExternalLink, 
  Music, 
  TrendingUp, 
  Search,
  Shuffle,
  Repeat,
  Volume2,
  Clock,
  Users,
  Star
} from 'lucide-react';

const SpotifyRecommendations = () => {
  const { 
    recommendations, 
    loading, 
    error, 
    getRecommendations,
    likeTrack 
  } = useMusic();
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [context, setContext] = useState('general');
  const [useML, setUseML] = useState(true);

  const contexts = [
    { value: 'general', label: 'General', icon: '🎵' },
    { value: 'workout', label: 'Workout', icon: '💪' },
    { value: 'chill', label: 'Chill', icon: '😌' },
    { value: 'party', label: 'Party', icon: '🎉' },
    { value: 'focus', label: 'Focus', icon: '🧠' },
    { value: 'sleep', label: 'Sleep', icon: '😴' }
  ];

  useEffect(() => {
    loadRecommendations();
    loadTrendingTracks();
  }, [context, useML]);

  const loadRecommendations = async () => {
    try {
      await getRecommendations(context, 20, useML);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadTrendingTracks = async () => {
    try {
      const response = await recommendationsAPI.getTrendingTracks({ limit: 10 });
      setTrendingTracks(response.data.data.trending_tracks);
    } catch (error) {
      console.error('Error loading trending tracks:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await recommendationsAPI.searchSpotify({ 
        q: query, 
        type: 'track', 
        limit: 20 
      });
      setSearchResults(response.data.data.results);
      setActiveTab('search');
    } catch (error) {
      toast.error('Search failed. Please try again.');
    }
  };

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      setCurrentTrack(null);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleLikeTrack = async (track) => {
    try {
      await likeTrack(track.id, 5.0, context);
      toast.success(`Liked ${track.track_name} by ${track.artist_name}`);
    } catch (error) {
      toast.error('Failed to like track');
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTrackImage = (track) => {
    return track.spotify_data?.album_image || 
           track.album_image || 
           'https://via.placeholder.com/300x300/1e293b/64748b?text=No+Image';
  };

  const getSpotifyUrl = (track) => {
    return track.spotify_data?.url || track.spotify_url;
  };

  const getPreviewUrl = (track) => {
    return track.spotify_data?.preview_url || track.preview_url;
  };

  const TrackCard = ({ track, showContext = true }) => (
    <div className="bg-dark-800 rounded-lg p-4 hover:bg-dark-700 transition-colors group">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img
            src={getTrackImage(track)}
            alt={`${track.track_name} album cover`}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <button
            onClick={() => handlePlayTrack(track)}
            className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {currentTrack?.id === track.id && isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{track.track_name}</h3>
          <p className="text-dark-300 text-sm truncate">{track.artist_name}</p>
          <p className="text-dark-400 text-xs truncate">{track.album}</p>
          
          {showContext && track.spotify_data?.genres && (
            <div className="flex flex-wrap gap-1 mt-2">
              {track.spotify_data.genres.slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            {track.spotify_data?.popularity && (
              <div className="flex items-center space-x-1 text-dark-400 text-xs">
                <Star className="w-3 h-3" />
                <span>{track.spotify_data.popularity}</span>
              </div>
            )}
            
            {track.spotify_data?.preview_url && (
              <div className="flex items-center space-x-1 text-dark-400 text-xs">
                <Volume2 className="w-3 h-3" />
                <span>Preview</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleLikeTrack(track)}
              className="p-2 text-dark-400 hover:text-red-400 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
            
            {getSpotifyUrl(track) && (
              <a
                href={getSpotifyUrl(track)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-dark-400 hover:text-green-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
      
      {track.audio_features && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-dark-400">Energy</div>
            <div className="text-white font-semibold">
              {Math.round(track.audio_features.energy * 100)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-dark-400">Dance</div>
            <div className="text-white font-semibold">
              {Math.round(track.audio_features.danceability * 100)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-dark-400">Mood</div>
            <div className="text-white font-semibold">
              {Math.round(track.audio_features.valence * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          🎵 Spotify-Powered Recommendations
        </h1>
        <p className="text-dark-300">
          Discover music with AI-powered recommendations and real-time Spotify integration
        </p>
      </div>

      {/* Controls */}
      <div className="bg-dark-800 rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Context Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-dark-300 text-sm">Context:</span>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-dark-700 text-white px-3 py-2 rounded-lg border border-dark-600 focus:border-primary-500 focus:outline-none"
            >
              {contexts.map(ctx => (
                <option key={ctx.value} value={ctx.value}>
                  {ctx.icon} {ctx.label}
                </option>
              ))}
            </select>
          </div>

          {/* ML Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-dark-300 text-sm">ML Engine:</span>
            <button
              onClick={() => setUseML(!useML)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                useML 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              {useML ? '🤖 ML Enabled' : '⚡ Basic'}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tracks, artists, or albums on Spotify..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 text-white rounded-lg border border-dark-600 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'recommendations', label: 'AI Recommendations', icon: '🤖' },
          { id: 'trending', label: 'Trending', icon: '📈' },
          { id: 'search', label: 'Search Results', icon: '🔍' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && activeTab === 'recommendations' ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-dark-300">Loading AI recommendations...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'recommendations' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Your {contexts.find(c => c.value === context)?.label} Recommendations
                </h2>
                <div className="flex items-center space-x-2 text-sm text-dark-300">
                  <span>{recommendations.length} tracks</span>
                  {useML && <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded-full">ML Powered</span>}
                </div>
              </div>
              
              {recommendations.length > 0 ? (
                <div className="grid gap-4">
                  {recommendations.map((track, index) => (
                    <TrackCard key={`${track.id}-${index}`} track={track} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                  <p className="text-dark-300">No recommendations available</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'trending' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Trending Now</h2>
                <TrendingUp className="w-5 h-5 text-primary-500" />
              </div>
              
              {trendingTracks.length > 0 ? (
                <div className="grid gap-4">
                  {trendingTracks.map((track, index) => (
                    <TrackCard key={`trending-${track.id}-${index}`} track={track} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                  <p className="text-dark-300">No trending tracks available</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'search' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Search Results for "{searchQuery}"
                </h2>
                <Search className="w-5 h-5 text-primary-500" />
              </div>
              
              {searchResults.length > 0 ? (
                <div className="grid gap-4">
                  {searchResults.map((track, index) => (
                    <TrackCard key={`search-${track.id}-${index}`} track={track} />
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                  <p className="text-dark-300">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                  <p className="text-dark-300">Enter a search query to find tracks</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Now Playing */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 p-4">
          <div className="max-w-6xl mx-auto flex items-center space-x-4">
            <img
              src={getTrackImage(currentTrack)}
              alt="Now playing"
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate">{currentTrack.track_name}</h4>
              <p className="text-dark-300 text-sm truncate">{currentTrack.artist_name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              {getSpotifyUrl(currentTrack) && (
                <a
                  href={getSpotifyUrl(currentTrack)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyRecommendations;
