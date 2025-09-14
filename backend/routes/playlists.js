const express = require('express');
const Track = require('../models/Track');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/playlists/generate
// @desc    Generate a themed playlist
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { 
      theme = 'discovery', 
      num_tracks = 20, 
      context = 'general',
      include_user_preferences = true 
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let playlistTracks = [];

    switch (theme) {
      case 'workout':
        playlistTracks = await generateWorkoutPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'chill':
        playlistTracks = await generateChillPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'party':
        playlistTracks = await generatePartyPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'focus':
        playlistTracks = await generateFocusPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'sleep':
        playlistTracks = await generateSleepPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'discovery':
        playlistTracks = await generateDiscoveryPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'throwback':
        playlistTracks = await generateThrowbackPlaylist(user, parseInt(num_tracks), include_user_preferences);
        break;
      case 'mood':
        playlistTracks = await generateMoodPlaylist(user, parseInt(num_tracks), context, include_user_preferences);
        break;
      default:
        playlistTracks = await generateGeneralPlaylist(user, parseInt(num_tracks), include_user_preferences);
    }

    // Calculate playlist duration
    const totalDuration = playlistTracks.reduce((total, track) => {
      return total + (track.audio_features?.duration_ms || 0);
    }, 0);

    const durationMinutes = Math.floor(totalDuration / 60000);
    const durationSeconds = Math.floor((totalDuration % 60000) / 1000);

    res.json({
      status: 'success',
      data: {
        playlist: {
          theme,
          tracks: playlistTracks,
          total_tracks: playlistTracks.length,
          duration: {
            total_ms: totalDuration,
            minutes: durationMinutes,
            seconds: durationSeconds,
            formatted: `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
          },
          generated_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Playlist generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating playlist'
    });
  }
});

// @route   GET /api/playlists/themes
// @desc    Get available playlist themes
// @access  Private
router.get('/themes', auth, (req, res) => {
  const themes = [
    {
      id: 'workout',
      name: 'Workout',
      description: 'High-energy tracks perfect for exercise',
      emoji: '💪',
      features: ['High energy', 'Fast tempo', 'Motivational']
    },
    {
      id: 'chill',
      name: 'Chill',
      description: 'Relaxing tracks for unwinding',
      emoji: '😌',
      features: ['Low energy', 'Calm mood', 'Relaxing']
    },
    {
      id: 'party',
      name: 'Party',
      description: 'Upbeat tracks to get the party started',
      emoji: '🎉',
      features: ['High danceability', 'Upbeat', 'Energetic']
    },
    {
      id: 'focus',
      name: 'Focus',
      description: 'Instrumental and ambient tracks for concentration',
      emoji: '🧠',
      features: ['Instrumental', 'Minimal vocals', 'Concentration-friendly']
    },
    {
      id: 'sleep',
      name: 'Sleep',
      description: 'Calm tracks for bedtime',
      emoji: '😴',
      features: ['Very low energy', 'Slow tempo', 'Calming']
    },
    {
      id: 'discovery',
      name: 'Discovery',
      description: 'Hidden gems and new music discoveries',
      emoji: '🔍',
      features: ['Diverse selection', 'Less popular tracks', 'New discoveries']
    },
    {
      id: 'throwback',
      name: 'Throwback',
      description: 'Classic tracks from the past',
      emoji: '📻',
      features: ['Older tracks', 'Classic hits', 'Nostalgic']
    },
    {
      id: 'mood',
      name: 'Mood',
      description: 'Tracks that match your current mood',
      emoji: '🎭',
      features: ['Personalized', 'Mood-based', 'Adaptive']
    }
  ];

  res.json({
    status: 'success',
    data: {
      themes,
      total: themes.length
    }
  });
});

// @route   POST /api/playlists/save
// @desc    Save a playlist
// @access  Private
router.post('/save', auth, async (req, res) => {
  try {
    const { name, description, tracks, theme } = req.body;

    if (!name || !tracks || !Array.isArray(tracks)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide playlist name and tracks'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Create playlist object
    const playlist = {
      id: new Date().getTime().toString(),
      name,
      description: description || '',
      theme: theme || 'custom',
      tracks: tracks.map(track => ({
        trackId: track.id,
        trackName: track.track_name,
        artistName: track.artist_name,
        album: track.album,
        year: track.year,
        addedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to user's saved playlists (if you have a playlists field in User model)
    if (!user.savedPlaylists) {
      user.savedPlaylists = [];
    }
    user.savedPlaylists.push(playlist);
    await user.save();

    res.json({
      status: 'success',
      message: 'Playlist saved successfully',
      data: {
        playlist
      }
    });
  } catch (error) {
    console.error('Save playlist error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error saving playlist'
    });
  }
});

// @route   GET /api/playlists/saved
// @desc    Get user's saved playlists
// @access  Private
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const savedPlaylists = user.savedPlaylists || [];

    res.json({
      status: 'success',
      data: {
        playlists: savedPlaylists,
        total: savedPlaylists.length
      }
    });
  } catch (error) {
    console.error('Get saved playlists error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting saved playlists'
    });
  }
});

// Helper functions for playlist generation
async function generateWorkoutPlaylist(user, numTracks, includeUserPreferences) {
  const filters = {
    'audioFeatures.energy': { $gte: 0.7, $lte: 1.0 },
    'audioFeatures.tempo': { $gte: 120, $lte: 200 },
    'audioFeatures.valence': { $gte: 0.4, $lte: 1.0 },
    isActive: true
  };

  if (includeUserPreferences && user.preferences.audioFeatures) {
    // Adjust filters based on user preferences
    const userEnergy = user.preferences.audioFeatures.energy;
    if (userEnergy < 0.5) {
      filters['audioFeatures.energy'].$gte = 0.6; // Lower threshold for users who prefer lower energy
    }
  }

  const tracks = await Track.find(filters)
    .sort({ popularity_score: -1 })
    .limit(numTracks * 2); // Get more to allow for variety

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateChillPlaylist(user, numTracks, includeUserPreferences) {
  const filters = {
    'audioFeatures.energy': { $gte: 0.0, $lte: 0.5 },
    'audioFeatures.valence': { $gte: 0.3, $lte: 0.8 },
    'audioFeatures.tempo': { $gte: 60, $lte: 120 },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ popularity_score: -1 })
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generatePartyPlaylist(user, numTracks, includeUserPreferences) {
  const filters = {
    'audioFeatures.danceability': { $gte: 0.7, $lte: 1.0 },
    'audioFeatures.energy': { $gte: 0.7, $lte: 1.0 },
    'audioFeatures.valence': { $gte: 0.5, $lte: 1.0 },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ popularity_score: -1 })
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateFocusPlaylist(user, numTracks, includeUserPreferences) {
  const filters = {
    'audioFeatures.instrumentalness': { $gte: 0.5, $lte: 1.0 },
    'audioFeatures.speechiness': { $gte: 0.0, $lte: 0.3 },
    'audioFeatures.energy': { $gte: 0.2, $lte: 0.7 },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ popularity_score: -1 })
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateSleepPlaylist(user, numTracks, includeUserPreferences) {
  const filters = {
    'audioFeatures.energy': { $gte: 0.0, $lte: 0.3 },
    'audioFeatures.tempo': { $gte: 60, $lte: 100 },
    'audioFeatures.valence': { $gte: 0.2, $lte: 0.6 },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ popularity_score: -1 })
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateDiscoveryPlaylist(user, numTracks, includeUserPreferences) {
  // Focus on less popular but quality tracks
  const filters = {
    popularity_score: { $gte: 20, $lte: 70 },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ popularity_score: 1 }) // Ascending to get less popular tracks first
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateThrowbackPlaylist(user, numTracks, includeUserPreferences) {
  const currentYear = new Date().getFullYear();
  const filters = {
    year: { $lte: currentYear - 5 },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ year: -1, popularity_score: -1 })
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateMoodPlaylist(user, numTracks, context, includeUserPreferences) {
  // Use user's recent listening history to determine mood
  const recentHistory = user.listeningHistory.slice(-20);
  
  if (recentHistory.length === 0) {
    return generateGeneralPlaylist(user, numTracks, includeUserPreferences);
  }

  // Calculate average mood from recent history
  const avgEnergy = recentHistory.reduce((sum, entry) => 
    sum + (entry.audioFeatures?.energy || 0.5), 0) / recentHistory.length;
  const avgValence = recentHistory.reduce((sum, entry) => 
    sum + (entry.audioFeatures?.valence || 0.5), 0) / recentHistory.length;

  const filters = {
    'audioFeatures.energy': { 
      $gte: Math.max(0, avgEnergy - 0.2), 
      $lte: Math.min(1, avgEnergy + 0.2) 
    },
    'audioFeatures.valence': { 
      $gte: Math.max(0, avgValence - 0.2), 
      $lte: Math.min(1, avgValence + 0.2) 
    },
    isActive: true
  };

  const tracks = await Track.find(filters)
    .sort({ popularity_score: -1 })
    .limit(numTracks * 2);

  return formatTracksForPlaylist(tracks.slice(0, numTracks));
}

async function generateGeneralPlaylist(user, numTracks, includeUserPreferences) {
  const tracks = await Track.find({ isActive: true })
    .sort({ popularity_score: -1 })
    .limit(numTracks);

  return formatTracksForPlaylist(tracks);
}

function formatTracksForPlaylist(tracks) {
  return tracks.map(track => ({
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
}

module.exports = router;
