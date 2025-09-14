const Track = require('../models/Track');
const User = require('../models/User');
const spotifyService = require('./spotifyService');
const { PythonShell } = require('python-shell');

class RecommendationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getHybridRecommendations(userId, context = 'general', limit = 20, useML = true) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let recommendations = [];

      if (useML) {
        // Try ML recommendations first
        recommendations = await this.getMLRecommendations(user, context, limit);
      }

      // If ML recommendations are insufficient or failed, supplement with Spotify
      if (recommendations.length < limit) {
        const spotifyRecs = await this.getSpotifyRecommendations(user, context, limit - recommendations.length);
        recommendations = [...recommendations, ...spotifyRecs];
      }

      // If still not enough, add database recommendations
      if (recommendations.length < limit) {
        const dbRecs = await this.getDatabaseRecommendations(user, context, limit - recommendations.length);
        recommendations = [...recommendations, ...dbRecs];
      }

      // Enrich with Spotify data
      const enrichedRecommendations = await this.enrichRecommendationsWithSpotify(recommendations);

      return enrichedRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting hybrid recommendations:', error);
      throw error;
    }
  }

  async getMLRecommendations(user, context, limit) {
    try {
      // Get tracks from database for ML processing
      const tracks = await Track.find({ isActive: true }).limit(10000);
      
      const userData = {
        userId: user._id.toString(),
        preferences: user.preferences,
        listeningHistory: user.listeningHistory.slice(-50),
        context,
        limit: parseInt(limit)
      };

      const tracksData = tracks.map(track => ({
        name: track.name,
        artists: track.artists,
        album: track.album,
        year: track.year,
        explicit: track.explicit,
        cluster: track.cluster,
        popularity_score: track.popularity_score,
        audioFeatures: track.audioFeatures
      }));

      const inputData = {
        user_data: userData,
        tracks_data: tracksData
      };

      const options = {
        mode: 'json',
        pythonPath: 'python3',
        scriptPath: './ml_scripts',
        args: [JSON.stringify(inputData)]
      };

      return new Promise((resolve, reject) => {
        PythonShell.run('recommendation_engine.py', options, (err, results) => {
          if (err) {
            console.error('ML recommendation error:', err);
            resolve([]);
            return;
          }

          try {
            const mlResults = JSON.parse(results[0]);
            if (mlResults.error) {
              console.error('ML error:', mlResults.error);
              resolve([]);
              return;
            }
            resolve(mlResults.tracks || []);
          } catch (parseError) {
            console.error('ML parse error:', parseError);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error in ML recommendations:', error);
      return [];
    }
  }

  async getSpotifyRecommendations(user, context, limit) {
    try {
      const userPreferences = {
        recentTracks: user.listeningHistory.slice(-10).map(entry => ({
          spotify_id: entry.spotifyId
        })).filter(entry => entry.spotify_id),
        favoriteArtists: user.preferences.favoriteGenres?.map(genre => ({
          spotify_id: null // Would need to map genres to artist IDs
        })) || [],
        favoriteGenres: user.preferences.favoriteGenres || []
      };

      const spotifyRecs = await spotifyService.getSpotifyRecommendations(userPreferences, context, limit);
      
      // Convert Spotify format to our format
      return spotifyRecs.map(track => ({
        id: track.spotify_id,
        track_name: track.name,
        artist_name: track.artists[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        year: new Date(track.album?.release_date || '2020').getFullYear(),
        explicit: track.explicit,
        audio_features: track.audio_features,
        spotify_data: {
          url: track.external_urls?.spotify,
          preview_url: track.preview_url,
          popularity: track.popularity,
          album_image: track.album?.images?.[0]?.url,
          release_date: track.album?.release_date,
          genres: track.genres || []
        },
        cluster: 0,
        popularity_score: track.popularity || 0
      }));
    } catch (error) {
      console.error('Error in Spotify recommendations:', error);
      return [];
    }
  }

  async getDatabaseRecommendations(user, context, limit) {
    try {
      // Get user's recent listening history
      const recentTracks = user.listeningHistory.slice(-20);
      const recentTrackIds = recentTracks.map(entry => entry.trackId);

      // Get context-based recommendations
      const contextFilters = this.getContextFilters(context);
      let query = { isActive: true, _id: { $nin: recentTrackIds } };

      // Apply context filters
      if (contextFilters.energy) {
        query['audioFeatures.energy'] = { $gte: contextFilters.energy.min, $lte: contextFilters.energy.max };
      }
      if (contextFilters.valence) {
        query['audioFeatures.valence'] = { $gte: contextFilters.valence.min, $lte: contextFilters.valence.max };
      }
      if (contextFilters.danceability) {
        query['audioFeatures.danceability'] = { $gte: contextFilters.danceability.min, $lte: contextFilters.danceability.max };
      }
      if (contextFilters.tempo) {
        query['audioFeatures.tempo'] = { $gte: contextFilters.tempo.min, $lte: contextFilters.tempo.max };
      }

      const tracks = await Track.find(query)
        .sort({ popularity_score: -1 })
        .limit(limit * 2);

      // If we have user preferences, try to match them
      if (user.preferences.audioFeatures) {
        const scoredTracks = tracks.map(track => ({
          track,
          score: this.calculatePreferenceScore(track, user.preferences.audioFeatures)
        }));

        scoredTracks.sort((a, b) => b.score - a.score);
        return scoredTracks.slice(0, limit).map(item => item.track);
      }

      return tracks.slice(0, limit);
    } catch (error) {
      console.error('Error in database recommendations:', error);
      return [];
    }
  }

  getContextFilters(context) {
    const filters = {
      workout: {
        energy: { min: 0.7, max: 1.0 },
        tempo: { min: 120, max: 200 },
        valence: { min: 0.4, max: 1.0 }
      },
      chill: {
        energy: { min: 0.0, max: 0.5 },
        valence: { min: 0.3, max: 0.8 },
        tempo: { min: 60, max: 120 }
      },
      party: {
        danceability: { min: 0.7, max: 1.0 },
        energy: { min: 0.7, max: 1.0 },
        valence: { min: 0.5, max: 1.0 }
      },
      focus: {
        instrumentalness: { min: 0.5, max: 1.0 },
        speechiness: { min: 0.0, max: 0.3 },
        energy: { min: 0.2, max: 0.7 }
      },
      sleep: {
        energy: { min: 0.0, max: 0.3 },
        tempo: { min: 60, max: 100 },
        valence: { min: 0.2, max: 0.6 }
      }
    };

    return filters[context] || {};
  }

  calculatePreferenceScore(track, userPreferences) {
    const features = ['danceability', 'energy', 'valence', 'acousticness', 'speechiness', 'instrumentalness'];
    let score = 0;
    let featureCount = 0;

    features.forEach(feature => {
      if (track.audioFeatures[feature] !== undefined && userPreferences[feature] !== undefined) {
        const diff = Math.abs(track.audioFeatures[feature] - userPreferences[feature]);
        score += 1 - diff; // Higher score for smaller difference
        featureCount++;
      }
    });

    return featureCount > 0 ? score / featureCount : 0;
  }

  async enrichRecommendationsWithSpotify(recommendations) {
    try {
      const enrichedRecs = await Promise.all(
        recommendations.map(async (rec) => {
          try {
            // If it already has Spotify data, return as is
            if (rec.spotify_data) {
              return rec;
            }

            // Enrich with Spotify data
            const enriched = await spotifyService.enrichTrackWithSpotifyData({
              name: rec.track_name,
              artists: [rec.artist_name],
              album: rec.album,
              year: rec.year,
              explicit: rec.explicit,
              audio_features: rec.audio_features
            });

            return {
              ...rec,
              spotify_data: {
                url: enriched.spotify_url,
                preview_url: enriched.preview_url,
                popularity: enriched.spotify_popularity,
                album_image: enriched.album_image,
                release_date: enriched.release_date,
                genres: enriched.genres || []
              },
              spotify_id: enriched.spotify_id
            };
          } catch (error) {
            console.error('Error enriching track:', error);
            return rec; // Return original if enrichment fails
          }
        })
      );

      return enrichedRecs;
    } catch (error) {
      console.error('Error enriching recommendations:', error);
      return recommendations;
    }
  }

  async getSimilarTracks(trackId, limit = 10) {
    try {
      const track = await Track.findById(trackId);
      if (!track) {
        throw new Error('Track not found');
      }

      // Get tracks from same cluster
      const clusterTracks = await Track.find({
        cluster: track.cluster,
        isActive: true,
        _id: { $ne: trackId }
      }).limit(limit * 2);

      // Score by audio feature similarity
      const scoredTracks = clusterTracks.map(t => ({
        track: t,
        score: this.calculateAudioFeatureSimilarity(track, t)
      }));

      scoredTracks.sort((a, b) => b.score - a.score);
      const similarTracks = scoredTracks.slice(0, limit).map(item => item.track);

      // Enrich with Spotify data
      return await this.enrichRecommendationsWithSpotify(similarTracks);
    } catch (error) {
      console.error('Error getting similar tracks:', error);
      throw error;
    }
  }

  calculateAudioFeatureSimilarity(track1, track2) {
    const features = ['danceability', 'energy', 'valence', 'acousticness', 'speechiness', 'instrumentalness'];
    let similarity = 0;
    let featureCount = 0;

    features.forEach(feature => {
      if (track1.audioFeatures[feature] !== undefined && track2.audioFeatures[feature] !== undefined) {
        const diff = Math.abs(track1.audioFeatures[feature] - track2.audioFeatures[feature]);
        similarity += 1 - diff;
        featureCount++;
      }
    });

    return featureCount > 0 ? similarity / featureCount : 0;
  }

  async getTrendingTracks(limit = 20) {
    try {
      // Get popular tracks from database
      const dbTracks = await Track.find({ isActive: true })
        .sort({ popularity_score: -1 })
        .limit(limit);

      // Get trending from Spotify
      const spotifyTracks = await spotifyService.getNewReleases({ limit: Math.min(limit, 10) });
      
      // Combine and deduplicate
      const allTracks = [...dbTracks];
      
      // Add Spotify tracks that aren't already in database
      for (const spotifyTrack of spotifyTracks) {
        const exists = allTracks.some(track => 
          track.name.toLowerCase() === spotifyTrack.name.toLowerCase() &&
          track.artists.some(artist => 
            spotifyTrack.artists.some(spotifyArtist => 
              artist.toLowerCase() === spotifyArtist.name.toLowerCase()
            )
          )
        );
        
        if (!exists) {
          allTracks.push({
            name: spotifyTrack.name,
            artists: spotifyTrack.artists.map(a => a.name),
            album: spotifyTrack.name,
            year: new Date(spotifyTrack.release_date).getFullYear(),
            explicit: false,
            spotify_data: {
              url: spotifyTrack.external_urls.spotify,
              preview_url: null,
              popularity: spotifyTrack.popularity,
              album_image: spotifyTrack.images[0]?.url,
              release_date: spotifyTrack.release_date,
              genres: []
            },
            cluster: 0,
            popularity_score: spotifyTrack.popularity || 0
          });
        }
      }

      return allTracks.slice(0, limit);
    } catch (error) {
      console.error('Error getting trending tracks:', error);
      throw error;
    }
  }

  async searchWithSpotify(query, type = 'track', limit = 20) {
    try {
      let results = [];

      switch (type) {
        case 'track':
          results = await spotifyService.searchTracks(query, { limit });
          break;
        case 'artist':
          results = await spotifyService.searchArtists(query, { limit });
          break;
        case 'album':
          results = await spotifyService.searchAlbums(query, { limit });
          break;
        default:
          results = await spotifyService.searchTracks(query, { limit });
      }

      return results;
    } catch (error) {
      console.error('Error searching with Spotify:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
