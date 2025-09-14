const mongoose = require('mongoose');
const Track = require('../models/Track');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

// Sample tracks data
const sampleTracks = [
  {
    name: "Bohemian Rhapsody",
    artists: ["Queen"],
    album: "A Night at the Opera",
    year: 1975,
    explicit: false,
    audioFeatures: {
      danceability: 0.6,
      energy: 0.7,
      key: 0,
      loudness: -8.2,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.2,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.3,
      tempo: 72,
      duration_ms: 355000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/4u7EnebtmKWnUHUrNcQ4fU",
      preview_url: "https://p.scdn.co/mp3-preview/4u7EnebtmKWnUHUrNcQ4fU",
      popularity: 85,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ce4f1737e8c849033b56b7e0",
      release_date: "1975-10-31",
      genres: ["rock", "classic rock", "progressive rock"]
    },
    cluster: 1,
    popularity_score: 85
  },
  {
    name: "Shape of You",
    artists: ["Ed Sheeran"],
    album: "÷ (Divide)",
    year: 2017,
    explicit: false,
    audioFeatures: {
      danceability: 0.8,
      energy: 0.7,
      key: 0,
      loudness: -3.2,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.1,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.8,
      tempo: 96,
      duration_ms: 233000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3",
      preview_url: "https://p.scdn.co/mp3-preview/7qiZfU4dY1lWllzX7mPBI3",
      popularity: 90,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      release_date: "2017-01-06",
      genres: ["pop", "acoustic pop"]
    },
    cluster: 2,
    popularity_score: 90
  },
  {
    name: "Blinding Lights",
    artists: ["The Weeknd"],
    album: "After Hours",
    year: 2020,
    explicit: false,
    audioFeatures: {
      danceability: 0.7,
      energy: 0.8,
      key: 1,
      loudness: -5.9,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.1,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.5,
      tempo: 171,
      duration_ms: 200000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/0VjIjW4Wj7e9o8b6q8q7q7",
      preview_url: "https://p.scdn.co/mp3-preview/0VjIjW4Wj7e9o8b6q8q7q7",
      popularity: 88,
      album_image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
      release_date: "2020-03-20",
      genres: ["pop", "synthpop", "new wave"]
    },
    cluster: 3,
    popularity_score: 88
  },
  {
    name: "Watermelon Sugar",
    artists: ["Harry Styles"],
    album: "Fine Line",
    year: 2019,
    explicit: false,
    audioFeatures: {
      danceability: 0.7,
      energy: 0.6,
      key: 7,
      loudness: -6.1,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.3,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.8,
      tempo: 95,
      duration_ms: 174000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY",
      preview_url: "https://p.scdn.co/mp3-preview/6UelLqGlWMcVH1E5c4H7lY",
      popularity: 87,
      album_image: "https://i.scdn.co/image/ab67616d0000b273f7b7174bef6f3fbf4c8a3522",
      release_date: "2019-11-16",
      genres: ["pop", "indie pop"]
    },
    cluster: 2,
    popularity_score: 87
  },
  {
    name: "Levitating",
    artists: ["Dua Lipa"],
    album: "Future Nostalgia",
    year: 2020,
    explicit: false,
    audioFeatures: {
      danceability: 0.8,
      energy: 0.7,
      key: 1,
      loudness: -4.8,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.1,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.8,
      tempo: 103,
      duration_ms: 203000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9",
      preview_url: "https://p.scdn.co/mp3-preview/463CkQjx2Zk1yXoBuierM9",
      popularity: 89,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ef24c3d2b9b4b4b4b4b4b4b4",
      release_date: "2020-03-27",
      genres: ["pop", "disco", "funk"]
    },
    cluster: 2,
    popularity_score: 89
  },
  {
    name: "Good 4 U",
    artists: ["Olivia Rodrigo"],
    album: "SOUR",
    year: 2021,
    explicit: false,
    audioFeatures: {
      danceability: 0.6,
      energy: 0.8,
      key: 0,
      loudness: -4.2,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.1,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.4,
      tempo: 166,
      duration_ms: 178000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG",
      preview_url: "https://p.scdn.co/mp3-preview/4ZtFanR9U6ndgddUvNcjcG",
      popularity: 86,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ef24c3d2b9b4b4b4b4b4b4b4",
      release_date: "2021-05-14",
      genres: ["pop", "pop rock", "alternative pop"]
    },
    cluster: 3,
    popularity_score: 86
  },
  {
    name: "Stay",
    artists: ["The Kid LAROI", "Justin Bieber"],
    album: "F*CK LOVE 3: OVER YOU",
    year: 2021,
    explicit: true,
    audioFeatures: {
      danceability: 0.7,
      energy: 0.6,
      key: 0,
      loudness: -5.8,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.2,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.5,
      tempo: 170,
      duration_ms: 141000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/5PjdY0CKGZdEuoNab3yDmX",
      preview_url: "https://p.scdn.co/mp3-preview/5PjdY0CKGZdEuoNab3yDmX",
      popularity: 91,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ef24c3d2b9b4b4b4b4b4b4b4",
      release_date: "2021-07-09",
      genres: ["pop", "hip hop", "trap"]
    },
    cluster: 3,
    popularity_score: 91
  },
  {
    name: "Heat Waves",
    artists: ["Glass Animals"],
    album: "Dreamland",
    year: 2020,
    explicit: false,
    audioFeatures: {
      danceability: 0.7,
      energy: 0.6,
      key: 0,
      loudness: -6.1,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.1,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.6,
      tempo: 80,
      duration_ms: 238000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/02MWAaffLxlfxAUY7c5dvx",
      preview_url: "https://p.scdn.co/mp3-preview/02MWAaffLxlfxAUY7c5dvx",
      popularity: 84,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ef24c3d2b9b4b4b4b4b4b4b4",
      release_date: "2020-08-07",
      genres: ["indie pop", "alternative", "electronic"]
    },
    cluster: 4,
    popularity_score: 84
  },
  {
    name: "Industry Baby",
    artists: ["Lil Nas X", "Jack Harlow"],
    album: "MONTERO",
    year: 2021,
    explicit: true,
    audioFeatures: {
      danceability: 0.8,
      energy: 0.7,
      key: 0,
      loudness: -4.5,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.1,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.7,
      tempo: 150,
      duration_ms: 212000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/27NovPIUIRrOZoCHxABJwK",
      preview_url: "https://p.scdn.co/mp3-preview/27NovPIUIRrOZoCHxABJwK",
      popularity: 88,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ef24c3d2b9b4b4b4b4b4b4b4",
      release_date: "2021-07-23",
      genres: ["hip hop", "pop", "trap"]
    },
    cluster: 3,
    popularity_score: 88
  },
  {
    name: "Peaches",
    artists: ["Justin Bieber", "Daniel Caesar", "Giveon"],
    album: "Justice",
    year: 2021,
    explicit: false,
    audioFeatures: {
      danceability: 0.7,
      energy: 0.5,
      key: 0,
      loudness: -6.8,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.3,
      instrumentalness: 0.0,
      liveness: 0.1,
      valence: 0.7,
      tempo: 90,
      duration_ms: 198000,
      time_signature: 4
    },
    spotifyData: {
      url: "https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI",
      preview_url: "https://p.scdn.co/mp3-preview/4iJyoBOLtHqaGxP12qzhQI",
      popularity: 87,
      album_image: "https://i.scdn.co/image/ab67616d0000b273ef24c3d2b9b4b4b4b4b4b4b4",
      release_date: "2021-03-19",
      genres: ["pop", "r&b", "soul"]
    },
    cluster: 2,
    popularity_score: 87
  }
];

// Sample user data
const sampleUsers = [
  {
    username: "demo_user",
    email: "demo@musicapp.com",
    password: "demo123",
    preferences: {
      favoriteGenres: ["pop", "rock", "indie"],
      listeningContexts: {
        workout: 5,
        chill: 8,
        party: 3,
        focus: 6,
        sleep: 2,
        general: 10
      },
      audioFeatures: {
        danceability: 0.7,
        energy: 0.6,
        valence: 0.7,
        acousticness: 0.3,
        speechiness: 0.1,
        instrumentalness: 0.2
      }
    },
    analytics: {
      totalTracksLiked: 0,
      diversityScore: 0,
      discoveryRate: 0,
      recommendationAccuracy: 0,
      lastActive: new Date()
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/music_recommendation');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Track.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Insert sample tracks
    const tracks = await Track.insertMany(sampleTracks);
    console.log(`✅ Inserted ${tracks.length} tracks`);

    // Insert sample users
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${users.length} users`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Sample Data:');
    console.log(`- Tracks: ${tracks.length}`);
    console.log(`- Users: ${users.length}`);
    console.log('\n🔑 Demo Credentials:');
    console.log('Email: demo@musicapp.com');
    console.log('Password: demo123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
