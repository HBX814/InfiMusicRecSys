const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  artists: {
    type: [String],
    required: true
  },
  album: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  explicit: {
    type: Boolean,
    default: false
  },
  audioFeatures: {
    danceability: { type: Number, min: 0, max: 1 },
    energy: { type: Number, min: 0, max: 1 },
    key: { type: Number, min: 0, max: 11 },
    loudness: { type: Number },
    mode: { type: Number, min: 0, max: 1 },
    speechiness: { type: Number, min: 0, max: 1 },
    acousticness: { type: Number, min: 0, max: 1 },
    instrumentalness: { type: Number, min: 0, max: 1 },
    liveness: { type: Number, min: 0, max: 1 },
    valence: { type: Number, min: 0, max: 1 },
    tempo: { type: Number, min: 0 },
    duration_ms: { type: Number, min: 0 },
    time_signature: { type: Number, min: 0, max: 7 }
  },
  spotifyData: {
    url: String,
    preview_url: String,
    popularity: { type: Number, min: 0, max: 100 },
    album_image: String,
    release_date: String,
    genres: [String]
  },
  cluster: {
    type: Number,
    default: 0
  },
  popularity_score: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
trackSchema.index({ name: 'text', artists: 'text', album: 'text' });
trackSchema.index({ 'audioFeatures.danceability': 1 });
trackSchema.index({ 'audioFeatures.energy': 1 });
trackSchema.index({ 'audioFeatures.valence': 1 });
trackSchema.index({ 'audioFeatures.tempo': 1 });
trackSchema.index({ year: 1 });
trackSchema.index({ cluster: 1 });
trackSchema.index({ popularity_score: -1 });

// Virtual for derived features
trackSchema.virtual('mood_energy').get(function() {
  if (this.audioFeatures.energy && this.audioFeatures.valence) {
    return this.audioFeatures.energy * this.audioFeatures.valence;
  }
  return 0;
});

trackSchema.virtual('dance_tempo').get(function() {
  if (this.audioFeatures.danceability && this.audioFeatures.tempo) {
    return this.audioFeatures.danceability * (this.audioFeatures.tempo / 200);
  }
  return 0;
});

trackSchema.virtual('acoustic_instrumental').get(function() {
  if (this.audioFeatures.acousticness && this.audioFeatures.instrumentalness) {
    return (this.audioFeatures.acousticness + this.audioFeatures.instrumentalness) / 2;
  }
  return 0;
});

// Method to calculate similarity with another track
trackSchema.methods.calculateSimilarity = function(otherTrack) {
  const features = [
    'danceability', 'energy', 'valence', 'acousticness', 
    'speechiness', 'instrumentalness', 'liveness'
  ];
  
  let similarity = 0;
  let featureCount = 0;
  
  features.forEach(feature => {
    if (this.audioFeatures[feature] !== undefined && 
        otherTrack.audioFeatures[feature] !== undefined) {
      const diff = Math.abs(this.audioFeatures[feature] - otherTrack.audioFeatures[feature]);
      similarity += 1 - diff; // Higher similarity for smaller differences
      featureCount++;
    }
  });
  
  return featureCount > 0 ? similarity / featureCount : 0;
};

// Method to check if track matches context
trackSchema.methods.matchesContext = function(context) {
  const contextFilters = {
    workout: {
      energy: { min: 0.7, max: 1.0 },
      tempo: { min: 120, max: 200 }
    },
    chill: {
      energy: { min: 0.0, max: 0.5 },
      valence: { min: 0.3, max: 0.8 }
    },
    party: {
      danceability: { min: 0.7, max: 1.0 },
      energy: { min: 0.7, max: 1.0 }
    },
    focus: {
      instrumentalness: { min: 0.5, max: 1.0 },
      speechiness: { min: 0.0, max: 0.3 }
    },
    sleep: {
      energy: { min: 0.0, max: 0.3 },
      tempo: { min: 60, max: 100 }
    }
  };
  
  const filters = contextFilters[context] || {};
  
  for (const [feature, range] of Object.entries(filters)) {
    const value = this.audioFeatures[feature];
    if (value !== undefined) {
      if (value < range.min || value > range.max) {
        return false;
      }
    }
  }
  
  return true;
};

// Static method to find similar tracks
trackSchema.statics.findSimilarTracks = function(trackId, limit = 10) {
  return this.findById(trackId).then(track => {
    if (!track) return [];
    
    return this.find({
      _id: { $ne: trackId },
      isActive: true
    }).then(tracks => {
      return tracks
        .map(t => ({
          track: t,
          similarity: track.calculateSimilarity(t)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.track);
    });
  });
};

// Static method to find tracks by context
trackSchema.statics.findByContext = function(context, limit = 20) {
  const contextFilters = {
    workout: {
      'audioFeatures.energy': { $gte: 0.7, $lte: 1.0 },
      'audioFeatures.tempo': { $gte: 120, $lte: 200 }
    },
    chill: {
      'audioFeatures.energy': { $gte: 0.0, $lte: 0.5 },
      'audioFeatures.valence': { $gte: 0.3, $lte: 0.8 }
    },
    party: {
      'audioFeatures.danceability': { $gte: 0.7, $lte: 1.0 },
      'audioFeatures.energy': { $gte: 0.7, $lte: 1.0 }
    },
    focus: {
      'audioFeatures.instrumentalness': { $gte: 0.5, $lte: 1.0 },
      'audioFeatures.speechiness': { $gte: 0.0, $lte: 0.3 }
    },
    sleep: {
      'audioFeatures.energy': { $gte: 0.0, $lte: 0.3 },
      'audioFeatures.tempo': { $gte: 60, $lte: 100 }
    }
  };
  
  const filters = contextFilters[context] || {};
  
  return this.find({
    ...filters,
    isActive: true
  })
  .sort({ popularity_score: -1 })
  .limit(limit);
};

// Static method to search tracks
trackSchema.statics.searchTracks = function(query, limit = 20) {
  return this.find({
    $text: { $search: query },
    isActive: true
  })
  .sort({ score: { $meta: 'textScore' }, popularity_score: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Track', trackSchema);
