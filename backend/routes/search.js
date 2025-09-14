const express = require('express');
const Track = require('../models/Track');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search
// @desc    Search for tracks
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { q: query, limit = 20, type = 'all' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }

    let searchResults = [];

    switch (type) {
      case 'tracks':
        searchResults = await searchTracks(query, parseInt(limit));
        break;
      case 'artists':
        searchResults = await searchArtists(query, parseInt(limit));
        break;
      case 'albums':
        searchResults = await searchAlbums(query, parseInt(limit));
        break;
      case 'all':
      default:
        searchResults = await searchAll(query, parseInt(limit));
        break;
    }

    res.json({
      status: 'success',
      data: {
        results: searchResults,
        query: query.trim(),
        type,
        total: searchResults.length
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error performing search'
    });
  }
});

// @route   GET /api/search/advanced
// @desc    Advanced search with filters
// @access  Private
router.get('/advanced', auth, async (req, res) => {
  try {
    const {
      query,
      genre,
      year_from,
      year_to,
      danceability_min,
      danceability_max,
      energy_min,
      energy_max,
      valence_min,
      valence_max,
      tempo_min,
      tempo_max,
      explicit,
      limit = 20
    } = req.query;

    // Build search filters
    const filters = { isActive: true };

    // Text search
    if (query && query.trim().length >= 2) {
      filters.$text = { $search: query.trim() };
    }

    // Year range
    if (year_from || year_to) {
      filters.year = {};
      if (year_from) filters.year.$gte = parseInt(year_from);
      if (year_to) filters.year.$lte = parseInt(year_to);
    }

    // Audio features filters
    if (danceability_min || danceability_max) {
      filters['audioFeatures.danceability'] = {};
      if (danceability_min) filters['audioFeatures.danceability'].$gte = parseFloat(danceability_min);
      if (danceability_max) filters['audioFeatures.danceability'].$lte = parseFloat(danceability_max);
    }

    if (energy_min || energy_max) {
      filters['audioFeatures.energy'] = {};
      if (energy_min) filters['audioFeatures.energy'].$gte = parseFloat(energy_min);
      if (energy_max) filters['audioFeatures.energy'].$lte = parseFloat(energy_max);
    }

    if (valence_min || valence_max) {
      filters['audioFeatures.valence'] = {};
      if (valence_min) filters['audioFeatures.valence'].$gte = parseFloat(valence_min);
      if (valence_max) filters['audioFeatures.valence'].$lte = parseFloat(valence_max);
    }

    if (tempo_min || tempo_max) {
      filters['audioFeatures.tempo'] = {};
      if (tempo_min) filters['audioFeatures.tempo'].$gte = parseFloat(tempo_min);
      if (tempo_max) filters['audioFeatures.tempo'].$lte = parseFloat(tempo_max);
    }

    // Explicit content filter
    if (explicit !== undefined) {
      filters.explicit = explicit === 'true';
    }

    // Genre filter (if genres are stored in spotifyData)
    if (genre) {
      filters['spotifyData.genres'] = { $in: [new RegExp(genre, 'i')] };
    }

    // Execute search
    const results = await Track.find(filters)
      .sort(query ? { score: { $meta: 'textScore' } } : { popularity_score: -1 })
      .limit(parseInt(limit));

    const formattedResults = results.map(track => ({
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
        results: formattedResults,
        filters: {
          query,
          genre,
          year_from,
          year_to,
          danceability_min,
          danceability_max,
          energy_min,
          energy_max,
          valence_min,
          valence_max,
          tempo_min,
          tempo_max,
          explicit
        },
        total: formattedResults.length
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error performing advanced search'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Query must be at least 2 characters long'
      });
    }

    const searchTerm = query.trim();
    
    // Get suggestions from different fields
    const [trackSuggestions, artistSuggestions, albumSuggestions] = await Promise.all([
      Track.find({
        name: { $regex: searchTerm, $options: 'i' },
        isActive: true
      })
      .select('name')
      .limit(5),
      
      Track.find({
        artists: { $regex: searchTerm, $options: 'i' },
        isActive: true
      })
      .select('artists')
      .limit(5),
      
      Track.find({
        album: { $regex: searchTerm, $options: 'i' },
        isActive: true
      })
      .select('album')
      .limit(5)
    ]);

    // Format suggestions
    const suggestions = {
      tracks: [...new Set(trackSuggestions.map(t => t.name))].slice(0, 3),
      artists: [...new Set(artistSuggestions.flatMap(t => t.artists))].slice(0, 3),
      albums: [...new Set(albumSuggestions.map(t => t.album))].slice(0, 3)
    };

    res.json({
      status: 'success',
      data: {
        suggestions,
        query: searchTerm
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting search suggestions'
    });
  }
});

// @route   GET /api/search/trending
// @desc    Get trending tracks
// @access  Private
router.get('/trending', auth, async (req, res) => {
  try {
    const { limit = 20, time_period = 'week' } = req.query;

    // For now, return most popular tracks
    // In a real implementation, you'd calculate trending based on recent activity
    const trendingTracks = await Track.find({ isActive: true })
      .sort({ popularity_score: -1 })
      .limit(parseInt(limit));

    const formattedTracks = trendingTracks.map(track => ({
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
        trending_tracks: formattedTracks,
        time_period,
        total: formattedTracks.length
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

// Helper functions
async function searchTracks(query, limit) {
  const tracks = await Track.find({
    $text: { $search: query },
    isActive: true
  })
  .sort({ score: { $meta: 'textScore' }, popularity_score: -1 })
  .limit(limit);

  return formatTracks(tracks);
}

async function searchArtists(query, limit) {
  const tracks = await Track.find({
    artists: { $regex: query, $options: 'i' },
    isActive: true
  })
  .sort({ popularity_score: -1 })
  .limit(limit);

  return formatTracks(tracks);
}

async function searchAlbums(query, limit) {
  const tracks = await Track.find({
    album: { $regex: query, $options: 'i' },
    isActive: true
  })
  .sort({ popularity_score: -1 })
  .limit(limit);

  return formatTracks(tracks);
}

async function searchAll(query, limit) {
  const tracks = await Track.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { artists: { $regex: query, $options: 'i' } },
      { album: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  })
  .sort({ popularity_score: -1 })
  .limit(limit);

  return formatTracks(tracks);
}

function formatTracks(tracks) {
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
