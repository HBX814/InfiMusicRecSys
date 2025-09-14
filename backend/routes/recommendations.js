const express = require('express');
const Track = require('../models/Track');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { PythonShell } = require('python-shell');
const recommendationService = require('../services/recommendationService');

const router = express.Router();

// @route   GET /api/recommendations/infinite-feed
// @desc    Get infinite feed recommendations with Spotify integration
// @access  Private
router.get('/infinite-feed', auth, async (req, res) => {
  try {
    const { context = 'general', limit = 20, useML = true } = req.query;
    
    const recommendations = await recommendationService.getHybridRecommendations(
      req.userId, 
      context, 
      parseInt(limit),
      useML === 'true'
    );

    res.json({
      status: 'success',
      data: {
        recommendations,
        context,
        total: recommendations.length,
        sources: {
          ml_enabled: useML === 'true',
          spotify_enabled: true
        }
      }
    });
  } catch (error) {
    console.error('Infinite feed error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting recommendations'
    });
  }
});

// @route   GET /api/recommendations/similar/:trackId
// @desc    Get similar tracks to a specific track with Spotify integration
// @access  Private
router.get('/similar/:trackId', auth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const { limit = 10 } = req.query;

    const similarTracks = await recommendationService.getSimilarTracks(trackId, parseInt(limit));

    res.json({
      status: 'success',
      data: {
        similar_tracks: similarTracks,
        total: similarTracks.length
      }
    });
  } catch (error) {
    console.error('Similar tracks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting similar tracks'
    });
  }
});

// @route   POST /api/recommendations/rate
// @desc    Rate a track and update user preferences
// @access  Private
router.post('/rate', auth, async (req, res) => {
  try {
    const { trackId, rating, context = 'general' } = req.body;

    if (!trackId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide valid trackId and rating (1-5)'
      });
    }

    const user = await User.findById(req.userId);
    const track = await Track.findById(trackId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!track) {
      return res.status(404).json({
        status: 'error',
        message: 'Track not found'
      });
    }

    // Prepare track data for history
    const trackData = {
      trackId: track._id.toString(),
      trackName: track.name,
      artistName: track.artists[0] || 'Unknown Artist',
      rating: parseInt(rating),
      context,
      spotifyId: track.spotifyId,
      audioFeatures: track.audioFeatures
    };

    // Add to user's listening history
    await user.addToHistory(trackData);

    res.json({
      status: 'success',
      message: 'Track rated successfully',
      data: {
        track: {
          id: track._id,
          name: track.name,
          artist: track.artists[0],
          rating: parseInt(rating),
          context
        },
        user_analytics: user.analytics
      }
    });
  } catch (error) {
    console.error('Rate track error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rating track'
    });
  }
});

// @route   GET /api/recommendations/context/:context
// @desc    Get recommendations for specific context
// @access  Private
router.get('/context/:context', auth, async (req, res) => {
  try {
    const { context } = req.params;
    const { limit = 20 } = req.query;

    const validContexts = ['workout', 'chill', 'party', 'focus', 'sleep', 'general'];
    
    if (!validContexts.includes(context)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid context. Must be one of: ' + validContexts.join(', ')
      });
    }

    let recommendations = [];

    if (context === 'general') {
      const user = await User.findById(req.userId);
      recommendations = await getHybridRecommendations(user, parseInt(limit));
    } else {
      recommendations = await Track.findByContext(context, parseInt(limit));
    }

    const formattedRecommendations = recommendations.map(track => ({
      id: track._id,
      track_name: track.name,
      artist_name: track.artists[0] || 'Unknown Artist',
      album: track.album,
      year: track.year,
      explicit: track.explicit,
      audio_features: track.audioFeatures,
      spotify_data: track.spotifyData,
      cluster: track.cluster,
      popularity_score: track.popularity_score
    }));

    res.json({
      status: 'success',
      data: {
        recommendations: formattedRecommendations,
        context,
        total: formattedRecommendations.length
      }
    });
  } catch (error) {
    console.error('Context recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting context recommendations'
    });
  }
});

// @route   POST /api/recommendations/ml-recommendations
// @desc    Get ML-powered recommendations using Python script
// @access  Private
router.post('/ml-recommendations', auth, async (req, res) => {
  try {
    const { trackId, context = 'general', limit = 20 } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get tracks from database for ML processing
    const tracks = await Track.find({ isActive: true }).limit(10000); // Limit for performance
    
    // Prepare data for Python script
    const userData = {
      userId: user._id.toString(),
      preferences: user.preferences,
      listeningHistory: user.listeningHistory.slice(-50), // Last 50 tracks
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

    if (trackId) {
      userData.trackId = trackId;
    }

    // Run Python ML script
    const options = {
      mode: 'json',
      pythonPath: 'python3',
      scriptPath: './ml_scripts',
      args: [JSON.stringify(inputData)]
    };

    PythonShell.run('recommendation_engine.py', options, (err, results) => {
      if (err) {
        console.error('Python script error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Error running ML recommendation engine'
        });
      }

      try {
        const mlResults = JSON.parse(results[0]);
        
        if (mlResults.error) {
          return res.status(500).json({
            status: 'error',
            message: mlResults.error
          });
        }
        
        res.json({
          status: 'success',
          data: {
            recommendations: mlResults.tracks || [],
            context,
            total: mlResults.tracks ? mlResults.tracks.length : 0,
            ml_insights: mlResults.insights || {}
          }
        });
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.status(500).json({
          status: 'error',
          message: 'Error parsing ML results'
        });
      }
    });
  } catch (error) {
    console.error('ML recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting ML recommendations'
    });
  }
});

// Helper function to get hybrid recommendations
async function getHybridRecommendations(user, limit) {
  try {
    // Get user's recent listening history
    const recentTracks = user.listeningHistory.slice(-20);
    
    if (recentTracks.length === 0) {
      // If no history, return popular tracks
      return await Track.find({ isActive: true })
        .sort({ popularity_score: -1 })
        .limit(limit);
    }

    // Get tracks from similar clusters
    const userClusters = recentTracks.map(track => track.cluster).filter(c => c !== undefined);
    const clusterCounts = {};
    userClusters.forEach(cluster => {
      clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
    });

    // Find most common cluster
    const favoriteCluster = Object.keys(clusterCounts).reduce((a, b) => 
      clusterCounts[a] > clusterCounts[b] ? a : b
    );

    // Get recommendations from favorite cluster
    const clusterRecommendations = await Track.find({
      cluster: parseInt(favoriteCluster),
      isActive: true,
      _id: { $nin: recentTracks.map(t => t.trackId) }
    })
    .sort({ popularity_score: -1 })
    .limit(Math.ceil(limit * 0.6));

    // Get diverse recommendations from other clusters
    const diverseRecommendations = await Track.find({
      cluster: { $ne: parseInt(favoriteCluster) },
      isActive: true,
      _id: { $nin: recentTracks.map(t => t.trackId) }
    })
    .sort({ popularity_score: -1 })
    .limit(Math.ceil(limit * 0.4));

    // Combine and shuffle recommendations
    const allRecommendations = [...clusterRecommendations, ...diverseRecommendations];
    return allRecommendations.slice(0, limit);
  } catch (error) {
    console.error('Hybrid recommendations error:', error);
    // Fallback to popular tracks
    return await Track.find({ isActive: true })
      .sort({ popularity_score: -1 })
      .limit(limit);
  }
}

// @route   GET /api/recommendations/trending
// @desc    Get trending tracks with Spotify integration
// @access  Private
router.get('/trending', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const trendingTracks = await recommendationService.getTrendingTracks(parseInt(limit));

    res.json({
      status: 'success',
      data: {
        trending_tracks: trendingTracks,
        total: trendingTracks.length
      }
    });
  } catch (error) {
    console.error('Trending tracks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting trending tracks'
    });
  }
});

// @route   GET /api/recommendations/spotify-search
// @desc    Search tracks using Spotify API
// @access  Private
router.get('/spotify-search', auth, async (req, res) => {
  try {
    const { q: query, type = 'track', limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const results = await recommendationService.searchWithSpotify(query, type, parseInt(limit));

    res.json({
      status: 'success',
      data: {
        results,
        query: query.trim(),
        type,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching with Spotify'
    });
  }
});

module.exports = router;
