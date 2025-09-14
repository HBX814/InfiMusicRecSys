const express = require('express');
const User = require('../models/User');
const Track = require('../models/Track');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/insights
// @desc    Get user analytics and insights
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const insights = user.getInsights();

    res.json({
      status: 'success',
      data: {
        insights,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics insights error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting analytics insights'
    });
  }
});

// @route   GET /api/analytics/listening-history
// @desc    Get user's listening history
// @access  Private
router.get('/listening-history', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, context } = req.query;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let history = user.listeningHistory;

    // Filter by context if specified
    if (context) {
      history = history.filter(entry => entry.context === context);
    }

    // Apply pagination
    const paginatedHistory = history
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .reverse(); // Most recent first

    // Get full track details
    const trackIds = paginatedHistory.map(entry => entry.trackId);
    const tracks = await Track.find({ _id: { $in: trackIds } });

    const trackMap = {};
    tracks.forEach(track => {
      trackMap[track._id.toString()] = track;
    });

    const detailedHistory = paginatedHistory.map(entry => {
      const track = trackMap[entry.trackId];
      return {
        id: entry._id,
        track: track ? {
          id: track._id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          year: track.year,
          explicit: track.explicit,
          audio_features: track.audioFeatures,
          spotify_data: track.spotifyData
        } : null,
        rating: entry.rating,
        context: entry.context,
        timestamp: entry.timestamp
      };
    });

    res.json({
      status: 'success',
      data: {
        history: detailedHistory,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: history.length,
          has_more: parseInt(offset) + parseInt(limit) < history.length
        },
        context: context || 'all'
      }
    });
  } catch (error) {
    console.error('Listening history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting listening history'
    });
  }
});

// @route   GET /api/analytics/taste-profile
// @desc    Get detailed music taste profile
// @access  Private
router.get('/taste-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const recentHistory = user.listeningHistory.slice(-100);
    
    if (recentHistory.length === 0) {
      return res.json({
        status: 'success',
        data: {
          message: 'No listening history available for taste analysis',
          taste_profile: {}
        }
      });
    }

    // Analyze audio features
    const featureAnalysis = {};
    const audioFeatures = ['danceability', 'energy', 'valence', 'acousticness', 'speechiness', 'instrumentalness'];

    audioFeatures.forEach(feature => {
      const values = recentHistory
        .map(entry => entry.audioFeatures?.[feature])
        .filter(val => val !== undefined && val !== null);
      
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);

        featureAnalysis[feature] = {
          average: parseFloat(avg.toFixed(3)),
          min: parseFloat(min.toFixed(3)),
          max: parseFloat(max.toFixed(3)),
          standard_deviation: parseFloat(std.toFixed(3)),
          preference: user.interpretFeaturePreference(feature, avg)
        };
      }
    });

    // Analyze genre preferences
    const genreCounts = {};
    recentHistory.forEach(entry => {
      if (entry.audioFeatures) {
        // This is a simplified genre analysis
        // In a real implementation, you'd have actual genre data
        const energy = entry.audioFeatures.energy || 0.5;
        const valence = entry.audioFeatures.valence || 0.5;
        const acousticness = entry.audioFeatures.acousticness || 0.5;

        let genre = 'Unknown';
        if (energy > 0.7 && valence > 0.6) genre = 'Pop/Rock';
        else if (energy > 0.7 && valence < 0.4) genre = 'Rock/Metal';
        else if (energy < 0.4 && valence > 0.6) genre = 'Folk/Acoustic';
        else if (energy < 0.4 && valence < 0.4) genre = 'Ambient/Chill';
        else if (acousticness > 0.7) genre = 'Acoustic';
        else if (entry.audioFeatures.speechiness > 0.5) genre = 'Hip-Hop/Rap';
        else genre = 'Electronic';

        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count, percentage: (count / recentHistory.length * 100).toFixed(1) }));

    // Analyze listening patterns
    const hourlyPatterns = {};
    const dailyPatterns = {};
    
    recentHistory.forEach(entry => {
      const date = new Date(entry.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      if (!hourlyPatterns[hour]) {
        hourlyPatterns[hour] = { count: 0, total_energy: 0, total_valence: 0 };
      }
      if (!dailyPatterns[day]) {
        dailyPatterns[day] = { count: 0, total_energy: 0, total_valence: 0 };
      }

      hourlyPatterns[hour].count++;
      dailyPatterns[day].count++;

      if (entry.audioFeatures) {
        hourlyPatterns[hour].total_energy += entry.audioFeatures.energy || 0.5;
        hourlyPatterns[hour].total_valence += entry.audioFeatures.valence || 0.5;
        dailyPatterns[day].total_energy += entry.audioFeatures.energy || 0.5;
        dailyPatterns[day].total_valence += entry.audioFeatures.valence || 0.5;
      }
    });

    // Calculate averages
    Object.keys(hourlyPatterns).forEach(hour => {
      const pattern = hourlyPatterns[hour];
      pattern.avg_energy = (pattern.total_energy / pattern.count).toFixed(3);
      pattern.avg_valence = (pattern.total_valence / pattern.count).toFixed(3);
      delete pattern.total_energy;
      delete pattern.total_valence;
    });

    Object.keys(dailyPatterns).forEach(day => {
      const pattern = dailyPatterns[day];
      pattern.avg_energy = (pattern.total_energy / pattern.count).toFixed(3);
      pattern.avg_valence = (pattern.total_valence / pattern.count).toFixed(3);
      delete pattern.total_energy;
      delete pattern.total_valence;
    });

    const tasteProfile = {
      audio_features: featureAnalysis,
      genre_preferences: topGenres,
      listening_patterns: {
        hourly: hourlyPatterns,
        daily: dailyPatterns
      },
      diversity_score: user.analytics.diversityScore,
      discovery_rate: user.analytics.discoveryRate,
      total_tracks_analyzed: recentHistory.length,
      analysis_period: 'last_100_tracks'
    };

    res.json({
      status: 'success',
      data: {
        taste_profile: tasteProfile,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Taste profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating taste profile'
    });
  }
});

// @route   GET /api/analytics/recommendation-accuracy
// @desc    Get recommendation accuracy metrics
// @access  Private
router.get('/recommendation-accuracy', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const recentHistory = user.listeningHistory.slice(-100);
    
    if (recentHistory.length === 0) {
      return res.json({
        status: 'success',
        data: {
          message: 'No listening history available for accuracy analysis',
          accuracy_metrics: {}
        }
      });
    }

    // Calculate accuracy metrics
    const ratings = recentHistory.map(entry => entry.rating);
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    const highRatedTracks = recentHistory.filter(entry => entry.rating >= 4).length;
    const accuracyPercentage = (highRatedTracks / recentHistory.length * 100).toFixed(1);

    // Context-based accuracy
    const contextAccuracy = {};
    const contexts = ['general', 'workout', 'chill', 'party', 'focus', 'sleep'];
    
    contexts.forEach(context => {
      const contextTracks = recentHistory.filter(entry => entry.context === context);
      if (contextTracks.length > 0) {
        const contextRatings = contextTracks.map(entry => entry.rating);
        const contextAvgRating = contextRatings.reduce((sum, rating) => sum + rating, 0) / contextRatings.length;
        const contextHighRated = contextTracks.filter(entry => entry.rating >= 4).length;
        const contextAccuracyPct = (contextHighRated / contextTracks.length * 100).toFixed(1);
        
        contextAccuracy[context] = {
          total_tracks: contextTracks.length,
          average_rating: parseFloat(contextAvgRating.toFixed(2)),
          accuracy_percentage: parseFloat(contextAccuracyPct),
          high_rated_tracks: contextHighRated
        };
      }
    });

    const accuracyMetrics = {
      overall_accuracy: parseFloat(accuracyPercentage),
      average_rating: parseFloat(avgRating.toFixed(2)),
      total_tracks_analyzed: recentHistory.length,
      high_rated_tracks: highRatedTracks,
      context_accuracy: contextAccuracy,
      recommendation_quality: avgRating >= 4 ? 'Excellent' : avgRating >= 3 ? 'Good' : 'Needs Improvement'
    };

    res.json({
      status: 'success',
      data: {
        accuracy_metrics: accuracyMetrics,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Recommendation accuracy error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error calculating recommendation accuracy'
    });
  }
});

// @route   GET /api/analytics/global-stats
// @desc    Get global statistics
// @access  Private
router.get('/global-stats', auth, async (req, res) => {
  try {
    const totalTracks = await Track.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    
    // Get most popular tracks
    const popularTracks = await Track.find({ isActive: true })
      .sort({ popularity_score: -1 })
      .limit(10)
      .select('name artists album popularity_score');

    // Get genre distribution (simplified)
    const genreStats = await Track.aggregate([
      { $match: { isActive: true, 'spotifyData.genres': { $exists: true, $ne: [] } } },
      { $unwind: '$spotifyData.genres' },
      { $group: { _id: '$spotifyData.genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const globalStats = {
      total_tracks: totalTracks,
      total_users: totalUsers,
      popular_tracks: popularTracks,
      genre_distribution: genreStats,
      generated_at: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: globalStats
    });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting global statistics'
    });
  }
});

module.exports = router;
