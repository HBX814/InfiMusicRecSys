# 🎵 Music Recommendation System

A comprehensive AI-powered music recommendation system built with React.js, Node.js, Express.js, MongoDB, and TailwindCSS. This system provides intelligent music recommendations, advanced search capabilities, analytics, and playlist generation.

## ✨ Features

### 🎯 Core Features
- **AI-Powered Recommendations**: Hybrid recommendation system combining content-based, collaborative, and popularity-based filtering
- **Smart Search**: Advanced search with filters for genre, year, audio features, and more
- **Playlist Generation**: Create themed playlists (workout, chill, party, focus, sleep, discovery, throwback)
- **User Analytics**: Comprehensive insights into listening habits and music taste
- **Spotify Integration**: Real-time Spotify data and preview functionality
- **User Authentication**: Secure user registration and login system

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Dark Theme**: Beautiful dark theme with gradient accents
- **Interactive Components**: Smooth animations and hover effects
- **Real-time Updates**: Live search and recommendation updates

### 🔧 Technical Features
- **RESTful API**: Well-structured backend API with proper error handling
- **Database Integration**: MongoDB with optimized queries and indexing
- **Context Management**: React Context for state management
- **Authentication**: JWT-based authentication with protected routes
- **Rate Limiting**: API rate limiting for security
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Tech Stack

### Frontend
- **React.js 19** - Modern React with hooks
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icons
- **Framer Motion** - Animation library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware

### ML/AI
- **Python 3.8+** - ML model development
- **Scikit-learn** - Machine learning library (PCA, KMeans, cosine similarity)
- **Spotify Web API** - Music data integration
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **Hybrid Recommendation Engine** - Content-based + Collaborative filtering

## 📁 Project Structure

```
InfiMusicRecSys-main/
├── backend/                    # Backend API
│   ├── models/                # Database models
│   │   ├── User.js           # User model with preferences
│   │   └── Track.js          # Track model with audio features
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── recommendations.js # Recommendation system
│   │   ├── search.js         # Search functionality
│   │   ├── analytics.js      # User analytics
│   │   ├── playlists.js      # Playlist generation
│   │   └── users.js          # User management
│   ├── ml_scripts/           # ML model integration
│   │   ├── recommendation_engine.py # Python ML engine
│   │   └── requirements.txt  # Python dependencies
│   ├── middleware/           # Custom middleware
│   │   └── auth.js           # JWT authentication
│   ├── scripts/              # Utility scripts
│   │   └── seedDatabase.js   # Database seeding
│   ├── server.js             # Express server setup
│   └── package.json          # Backend dependencies
├── musicfrontend/            # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.jsx          # Main app component
│   ├── tailwind.config.js   # TailwindCSS configuration
│   └── package.json         # Frontend dependencies
├── MLModel/                  # Machine learning model
│   └── music-spotify.ipynb  # Jupyter notebook with ML model
├── data/                     # Dataset
│   └── link_to_spotify1.2M_dataset.txt
└── README.md                # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Python (v3.8 or higher) - for ML model
- Spotify Developer Account (optional)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp config.env.example config.env
   ```
   
   Edit `config.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/music_recommendation
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the backend server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd musicfrontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### ML Model Setup (Optional)

1. **Install Python dependencies**
   ```bash
   pip install pandas numpy scikit-learn spotipy gradio
   ```

2. **Run the Jupyter notebook**
   ```bash
   jupyter notebook MLModel/music-spotify.ipynb
   ```

## 🎵 Usage

### Getting Started

1. **Register/Login**: Create an account or use demo credentials
2. **Explore Recommendations**: Get AI-powered music recommendations
3. **Search Music**: Use advanced search with filters
4. **Create Playlists**: Generate themed playlists
5. **View Analytics**: Check your music taste insights

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Recommendations
- `GET /api/recommendations/infinite-feed` - Get recommendations
- `GET /api/recommendations/similar/:trackId` - Get similar tracks
- `POST /api/recommendations/rate` - Rate a track
- `GET /api/recommendations/context/:context` - Context-based recommendations

#### Search
- `GET /api/search` - Search tracks
- `GET /api/search/advanced` - Advanced search with filters
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/trending` - Get trending tracks

#### Analytics
- `GET /api/analytics/insights` - Get user insights
- `GET /api/analytics/listening-history` - Get listening history
- `GET /api/analytics/taste-profile` - Get taste profile
- `GET /api/analytics/recommendation-accuracy` - Get accuracy metrics

#### Playlists
- `POST /api/playlists/generate` - Generate playlist
- `GET /api/playlists/themes` - Get available themes
- `POST /api/playlists/save` - Save playlist
- `GET /api/playlists/saved` - Get saved playlists

## 🎨 UI Components

### Design System
- **Colors**: Custom color palette with primary, secondary, and accent colors
- **Typography**: Inter and Poppins fonts for modern look
- **Spacing**: Consistent spacing using TailwindCSS utilities
- **Animations**: Smooth transitions and hover effects

### Key Components
- **MusicCard**: Track display with audio features and Spotify integration
- **SearchBar**: Real-time search with suggestions
- **PlaylistGenerator**: Theme-based playlist creation
- **AnalyticsDashboard**: User insights and statistics
- **MusicPlayer**: Integrated audio player with Spotify previews

## 🔧 Configuration

### TailwindCSS Configuration
The project uses a custom TailwindCSS configuration with:
- Extended color palette
- Custom animations
- Music-specific utilities
- Responsive design tokens

### API Configuration
- Rate limiting for security
- CORS configuration for cross-origin requests
- Error handling middleware
- Request/response logging

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or AWS

### Frontend Deployment
1. Build the production bundle
   ```bash
   npm run build
   ```
2. Deploy to platforms like Vercel, Netlify, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Spotify Web API for music data
- The machine learning community for algorithms
- Open source libraries and frameworks used
- Dataset providers for music data

