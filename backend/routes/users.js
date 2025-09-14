const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          spotifyId: user.spotifyId,
          preferences: user.preferences,
          analytics: user.analytics,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting user profile'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const { 
      favoriteGenres, 
      listeningContexts, 
      audioFeatures 
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update preferences
    if (favoriteGenres) {
      user.preferences.favoriteGenres = favoriteGenres;
    }

    if (listeningContexts) {
      user.preferences.listeningContexts = {
        ...user.preferences.listeningContexts,
        ...listeningContexts
      };
    }

    if (audioFeatures) {
      user.preferences.audioFeatures = {
        ...user.preferences.audioFeatures,
        ...audioFeatures
      };
    }

    await user.save();

    res.json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating preferences'
    });
  }
});

// @route   GET /api/users/listening-history
// @desc    Get user's listening history
// @access  Private
router.get('/listening-history', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const history = user.listeningHistory
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .reverse(); // Most recent first

    res.json({
      status: 'success',
      data: {
        history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: user.listeningHistory.length,
          has_more: parseInt(offset) + parseInt(limit) < user.listeningHistory.length
        }
      }
    });
  } catch (error) {
    console.error('Get listening history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting listening history'
    });
  }
});

// @route   DELETE /api/users/listening-history/:entryId
// @desc    Remove a track from listening history
// @access  Private
router.delete('/listening-history/:entryId', auth, async (req, res) => {
  try {
    const { entryId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Find and remove the entry
    const entryIndex = user.listeningHistory.findIndex(
      entry => entry._id.toString() === entryId
    );

    if (entryIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'History entry not found'
      });
    }

    user.listeningHistory.splice(entryIndex, 1);
    await user.save();

    res.json({
      status: 'success',
      message: 'History entry removed successfully'
    });
  } catch (error) {
    console.error('Remove history entry error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error removing history entry'
    });
  }
});

// @route   POST /api/users/clear-history
// @desc    Clear all listening history
// @access  Private
router.post('/clear-history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.listeningHistory = [];
    user.analytics.totalTracksLiked = 0;
    user.analytics.diversityScore = 0;
    user.analytics.discoveryRate = 0;
    user.analytics.recommendationAccuracy = 0;

    await user.save();

    res.json({
      status: 'success',
      message: 'Listening history cleared successfully'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error clearing listening history'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const stats = {
      total_tracks_liked: user.analytics.totalTracksLiked,
      diversity_score: user.analytics.diversityScore,
      discovery_rate: user.analytics.discoveryRate,
      recommendation_accuracy: user.analytics.recommendationAccuracy,
      account_created: user.createdAt,
      last_active: user.analytics.lastActive,
      favorite_genres: user.preferences.favoriteGenres.slice(0, 5),
      listening_contexts: user.preferences.listeningContexts,
      audio_preferences: user.preferences.audioFeatures
    };

    res.json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting user statistics'
    });
  }
});

// @route   POST /api/users/export-data
// @desc    Export user data
// @access  Private
router.post('/export-data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const exportData = {
      user_info: {
        username: user.username,
        email: user.email,
        created_at: user.createdAt,
        last_active: user.analytics.lastActive
      },
      preferences: user.preferences,
      analytics: user.analytics,
      listening_history: user.listeningHistory,
      export_date: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: {
        export_data: exportData,
        message: 'User data exported successfully'
      }
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error exporting user data'
    });
  }
});

module.exports = router;
