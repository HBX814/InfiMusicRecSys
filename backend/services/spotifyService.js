const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    this.accessToken = null;
    this.tokenExpiry = null;
    this.rateLimitDelay = 100; // ms between requests
    this.lastRequestTime = 0;
  }

  async initialize() {
    try {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('⚠️ Spotify credentials not provided. Spotify features will be limited.');
        return false;
      }

      await this.getClientCredentialsToken();
      console.log('✅ Spotify service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Spotify service:', error.message);
      return false;
    }
  }

  async getClientCredentialsToken() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.accessToken = data.body.access_token;
      this.tokenExpiry = Date.now() + (data.body.expires_in * 1000);
      this.spotifyApi.setAccessToken(this.accessToken);
    } catch (error) {
      throw new Error(`Failed to get Spotify access token: ${error.message}`);
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.getClientCredentialsToken();
    }
  }

  async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  async searchTrack(trackName, artistName, limit = 5) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const query = `track:"${trackName}" artist:"${artistName}"`;
      const response = await this.spotifyApi.searchTracks(query, { limit });
      
      if (response.body.tracks.items.length === 0) {
        // Try alternative search without quotes
        const altQuery = `${trackName} ${artistName}`;
        const altResponse = await this.spotifyApi.searchTracks(altQuery, { limit });
        return altResponse.body.tracks.items;
      }
      
      return response.body.tracks.items;
    } catch (error) {
      console.error(`Error searching for track "${trackName}" by "${artistName}":`, error.message);
      return [];
    }
  }

  async getTrackAudioFeatures(trackId) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getAudioFeaturesForTrack(trackId);
      return response.body;
    } catch (error) {
      console.error(`Error getting audio features for track ${trackId}:`, error.message);
      return null;
    }
  }

  async getTrackDetails(trackId) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getTrack(trackId);
      return response.body;
    } catch (error) {
      console.error(`Error getting track details for ${trackId}:`, error.message);
      return null;
    }
  }

  async getArtistDetails(artistId) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getArtist(artistId);
      return response.body;
    } catch (error) {
      console.error(`Error getting artist details for ${artistId}:`, error.message);
      return null;
    }
  }

  async getRecommendations(seedTracks, seedArtists, seedGenres, options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const params = {
        limit: options.limit || 20,
        market: options.market || 'US',
        ...options
      };

      if (seedTracks && seedTracks.length > 0) {
        params.seed_tracks = seedTracks.slice(0, 5).join(',');
      }
      if (seedArtists && seedArtists.length > 0) {
        params.seed_artists = seedArtists.slice(0, 5).join(',');
      }
      if (seedGenres && seedGenres.length > 0) {
        params.seed_genres = seedGenres.slice(0, 5).join(',');
      }

      const response = await this.spotifyApi.getRecommendations(params);
      return response.body.tracks;
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error.message);
      return [];
    }
  }

  async searchTracks(query, options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.searchTracks(query, {
        limit: options.limit || 20,
        market: options.market || 'US',
        ...options
      });
      
      return response.body.tracks.items;
    } catch (error) {
      console.error(`Error searching tracks with query "${query}":`, error.message);
      return [];
    }
  }

  async searchArtists(query, options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.searchArtists(query, {
        limit: options.limit || 20,
        market: options.market || 'US',
        ...options
      });
      
      return response.body.artists.items;
    } catch (error) {
      console.error(`Error searching artists with query "${query}":`, error.message);
      return [];
    }
  }

  async searchAlbums(query, options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.searchAlbums(query, {
        limit: options.limit || 20,
        market: options.market || 'US',
        ...options
      });
      
      return response.body.albums.items;
    } catch (error) {
      console.error(`Error searching albums with query "${query}":`, error.message);
      return [];
    }
  }

  async getPlaylistTracks(playlistId, options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getPlaylistTracks(playlistId, {
        limit: options.limit || 100,
        market: options.market || 'US',
        ...options
      });
      
      return response.body.items.map(item => item.track);
    } catch (error) {
      console.error(`Error getting playlist tracks for ${playlistId}:`, error.message);
      return [];
    }
  }

  async getNewReleases(options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getNewReleases({
        limit: options.limit || 20,
        country: options.country || 'US',
        ...options
      });
      
      return response.body.albums.items;
    } catch (error) {
      console.error('Error getting new releases:', error.message);
      return [];
    }
  }

  async getFeaturedPlaylists(options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getFeaturedPlaylists({
        limit: options.limit || 20,
        country: options.country || 'US',
        ...options
      });
      
      return response.body.playlists.items;
    } catch (error) {
      console.error('Error getting featured playlists:', error.message);
      return [];
    }
  }

  async getCategories(options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getCategories({
        limit: options.limit || 20,
        country: options.country || 'US',
        ...options
      });
      
      return response.body.categories.items;
    } catch (error) {
      console.error('Error getting categories:', error.message);
      return [];
    }
  }

  async getCategoryPlaylists(categoryId, options = {}) {
    try {
      await this.ensureValidToken();
      await this.rateLimitDelay();

      const response = await this.spotifyApi.getPlaylistsForCategory(categoryId, {
        limit: options.limit || 20,
        country: options.country || 'US',
        ...options
      });
      
      return response.body.playlists.items;
    } catch (error) {
      console.error(`Error getting playlists for category ${categoryId}:`, error.message);
      return [];
    }
  }

  formatTrackData(track, audioFeatures = null) {
    if (!track) return null;

    return {
      spotify_id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images,
        release_date: track.album.release_date,
        total_tracks: track.album.total_tracks
      },
      external_urls: track.external_urls,
      preview_url: track.preview_url,
      popularity: track.popularity,
      duration_ms: track.duration_ms,
      explicit: track.explicit,
      audio_features: audioFeatures,
      available_markets: track.available_markets
    };
  }

  formatArtistData(artist) {
    if (!artist) return null;

    return {
      spotify_id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      images: artist.images,
      external_urls: artist.external_urls,
      followers: artist.followers
    };
  }

  formatAlbumData(album) {
    if (!album) return null;

    return {
      spotify_id: album.id,
      name: album.name,
      artists: album.artists.map(artist => ({
        id: artist.id,
        name: artist.name
      })),
      images: album.images,
      release_date: album.release_date,
      total_tracks: album.total_tracks,
      external_urls: album.external_urls,
      popularity: album.popularity
    };
  }

  async enrichTrackWithSpotifyData(trackData) {
    try {
      if (!this.accessToken) {
        return trackData; // Return original data if Spotify not available
      }

      // Search for track on Spotify
      const spotifyTracks = await this.searchTrack(trackData.name, trackData.artists[0] || 'Unknown');
      
      if (spotifyTracks.length === 0) {
        return trackData; // Return original data if not found on Spotify
      }

      const spotifyTrack = spotifyTracks[0];
      const audioFeatures = await this.getTrackAudioFeatures(spotifyTrack.id);
      const artistDetails = await this.getArtistDetails(spotifyTrack.artists[0].id);

      return {
        ...trackData,
        spotify_id: spotifyTrack.id,
        spotify_url: spotifyTrack.external_urls.spotify,
        preview_url: spotifyTrack.preview_url,
        spotify_popularity: spotifyTrack.popularity,
        album_image: spotifyTrack.album.images[0]?.url,
        release_date: spotifyTrack.album.release_date,
        genres: artistDetails?.genres || [],
        audio_features: audioFeatures ? {
          danceability: audioFeatures.danceability,
          energy: audioFeatures.energy,
          key: audioFeatures.key,
          loudness: audioFeatures.loudness,
          mode: audioFeatures.mode,
          speechiness: audioFeatures.speechiness,
          acousticness: audioFeatures.acousticness,
          instrumentalness: audioFeatures.instrumentalness,
          liveness: audioFeatures.liveness,
          valence: audioFeatures.valence,
          tempo: audioFeatures.tempo,
          duration_ms: audioFeatures.duration_ms,
          time_signature: audioFeatures.time_signature
        } : trackData.audio_features
      };
    } catch (error) {
      console.error('Error enriching track with Spotify data:', error.message);
      return trackData; // Return original data on error
    }
  }

  async getSpotifyRecommendations(userPreferences, context = 'general', limit = 20) {
    try {
      if (!this.accessToken) {
        return [];
      }

      const seedTracks = userPreferences.recentTracks?.slice(0, 5).map(t => t.spotify_id).filter(Boolean) || [];
      const seedArtists = userPreferences.favoriteArtists?.slice(0, 5).map(a => a.spotify_id).filter(Boolean) || [];
      const seedGenres = userPreferences.favoriteGenres?.slice(0, 5) || [];

      const contextOptions = {
        workout: {
          min_energy: 0.7,
          max_energy: 1.0,
          min_tempo: 120,
          max_tempo: 200,
          min_valence: 0.4,
          max_valence: 1.0
        },
        chill: {
          min_energy: 0.0,
          max_energy: 0.5,
          min_valence: 0.3,
          max_valence: 0.8,
          min_tempo: 60,
          max_tempo: 120
        },
        party: {
          min_danceability: 0.7,
          max_danceability: 1.0,
          min_energy: 0.7,
          max_energy: 1.0,
          min_valence: 0.5,
          max_valence: 1.0
        },
        focus: {
          min_instrumentalness: 0.5,
          max_instrumentalness: 1.0,
          min_speechiness: 0.0,
          max_speechiness: 0.3,
          min_energy: 0.2,
          max_energy: 0.7
        },
        sleep: {
          min_energy: 0.0,
          max_energy: 0.3,
          min_tempo: 60,
          max_tempo: 100,
          min_valence: 0.2,
          max_valence: 0.6
        }
      };

      const options = {
        limit,
        ...contextOptions[context] || {}
      };

      const recommendations = await this.getRecommendations(seedTracks, seedArtists, seedGenres, options);
      
      return recommendations.map(track => this.formatTrackData(track));
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error.message);
      return [];
    }
  }
}

// Create singleton instance
const spotifyService = new SpotifyService();

module.exports = spotifyService;
