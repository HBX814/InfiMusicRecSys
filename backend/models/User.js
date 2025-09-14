const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  spotifyId: {
    type: String,
    default: null
  },
  preferences: {
    favoriteGenres: [String],
    listeningContexts: {
      workout: { type: Number, default: 0 },
      chill: { type: Number, default: 0 },
      party: { type: Number, default: 0 },
      focus: { type: Number, default: 0 },
      sleep: { type: Number, default: 0 },
      general: { type: Number, default: 0 }
    },
    audioFeatures: {
      danceability: { type: Number, default: 0.5 },
      energy: { type: Number, default: 0.5 },
      valence: { type: Number, default: 0.5 },
      acousticness: { type: Number, default: 0.5 },
      speechiness: { type: Number, default: 0.5 },
      instrumentalness: { type: Number, default: 0.5 }
    }
  },
  listeningHistory: [{
    trackId: { type: String, required: true },
    trackName: { type: String, required: true },
    artistName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    context: { type: String, default: 'general' },
    timestamp: { type: Date, default: Date.now },
    spotifyId: String,
    audioFeatures: {
      danceability: Number,
      energy: Number,
      valence: Number,
      acousticness: Number,
      speechiness: Number,
      instrumentalness: Number,
      tempo: Number,
      loudness: Number
    }
  }],
  analytics: {
    totalTracksLiked: { type: Number, default: 0 },
    diversityScore: { type: Number, default: 0 },
    discoveryRate: { type: Number, default: 0 },
    recommendationAccuracy: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'listeningHistory.timestamp': -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update preferences based on listening history
userSchema.methods.updatePreferences = function() {
  if (this.listeningHistory.length === 0) return;
  
  const recentHistory = this.listeningHistory.slice(-50); // Last 50 tracks
  
  // Update genre preferences
  const genreCount = {};
  recentHistory.forEach(entry => {
    if (entry.audioFeatures) {
      Object.keys(entry.audioFeatures).forEach(feature => {
        if (this.preferences.audioFeatures[feature] !== undefined) {
          this.preferences.audioFeatures[feature] = 
            (this.preferences.audioFeatures[feature] + entry.audioFeatures[feature]) / 2;
        }
      });
    }
  });
  
  // Update context preferences
  const contextCount = {};
  recentHistory.forEach(entry => {
    contextCount[entry.context] = (contextCount[entry.context] || 0) + 1;
  });
  
  Object.keys(contextCount).forEach(context => {
    if (this.preferences.listeningContexts[context] !== undefined) {
      this.preferences.listeningContexts[context] = contextCount[context];
    }
  });
  
  // Update analytics
  this.analytics.totalTracksLiked = this.listeningHistory.length;
  this.analytics.lastActive = new Date();
  
  // Calculate diversity score
  const uniqueArtists = new Set(recentHistory.map(entry => entry.artistName)).size;
  this.analytics.diversityScore = uniqueArtists / recentHistory.length;
  
  // Calculate discovery rate
  const uniqueTracks = new Set(recentHistory.map(entry => entry.trackId)).size;
  this.analytics.discoveryRate = uniqueTracks / recentHistory.length;
};

// Method to add track to listening history
userSchema.methods.addToHistory = function(trackData) {
  this.listeningHistory.push(trackData);
  
  // Keep only last 1000 entries
  if (this.listeningHistory.length > 1000) {
    this.listeningHistory = this.listeningHistory.slice(-1000);
  }
  
  this.updatePreferences();
  return this.save();
};

// Method to get user insights
userSchema.methods.getInsights = function() {
  const recentHistory = this.listeningHistory.slice(-100);
  
  if (recentHistory.length === 0) {
    return {
      message: 'No listening history available',
      totalTracksLiked: 0
    };
  }
  
  const insights = {
    totalTracksLiked: this.analytics.totalTracksLiked,
    diversityScore: this.analytics.diversityScore,
    discoveryRate: this.analytics.discoveryRate,
    recommendationAccuracy: this.analytics.recommendationAccuracy,
    favoriteGenres: this.preferences.favoriteGenres.slice(0, 5),
    listeningPatterns: {},
    musicTasteProfile: {}
  };
  
  // Analyze listening patterns by hour
  const hourlyPatterns = {};
  recentHistory.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    if (!hourlyPatterns[hour]) {
      hourlyPatterns[hour] = { energy: [], valence: [], count: 0 };
    }
    if (entry.audioFeatures) {
      hourlyPatterns[hour].energy.push(entry.audioFeatures.energy || 0.5);
      hourlyPatterns[hour].valence.push(entry.audioFeatures.valence || 0.5);
    }
    hourlyPatterns[hour].count++;
  });
  
  Object.keys(hourlyPatterns).forEach(hour => {
    const pattern = hourlyPatterns[hour];
    insights.listeningPatterns[`${hour}:00`] = {
      energy: pattern.energy.length > 0 ? 
        (pattern.energy.reduce((a, b) => a + b, 0) / pattern.energy.length).toFixed(3) : 0.5,
      mood: pattern.valence.length > 0 ? 
        (pattern.valence.reduce((a, b) => a + b, 0) / pattern.valence.length).toFixed(3) : 0.5,
      trackCount: pattern.count
    };
  });
  
  // Music taste profile
  Object.keys(this.preferences.audioFeatures).forEach(feature => {
    const value = this.preferences.audioFeatures[feature];
    insights.musicTasteProfile[feature] = {
      average: value.toFixed(3),
      preference: this.interpretFeaturePreference(feature, value)
    };
  });
  
  return insights;
};

// Helper method to interpret feature preferences
userSchema.methods.interpretFeaturePreference = function(feature, value) {
  const interpretations = {
    danceability: ['Not danceable', 'Somewhat danceable', 'Very danceable'],
    energy: ['Low energy', 'Moderate energy', 'High energy'],
    valence: ['Sad/Dark', 'Neutral mood', 'Happy/Uplifting'],
    acousticness: ['Electronic', 'Mixed', 'Acoustic'],
    speechiness: ['Instrumental', 'Some vocals', 'Very vocal/Rap'],
    instrumentalness: ['Vocal tracks', 'Mixed', 'Instrumental']
  };
  
  if (interpretations[feature]) {
    if (value < 0.33) return interpretations[feature][0];
    if (value < 0.67) return interpretations[feature][1];
    return interpretations[feature][2];
  }
  
  return `Value: ${value.toFixed(3)}`;
};

module.exports = mongoose.model('User', userSchema);
