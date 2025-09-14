# 🚀 Quick Start Guide

Get your Music Recommendation System up and running in minutes!

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

## Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- ✅ Check prerequisites
- ✅ Install all dependencies
- ✅ Configure environment files
- ✅ Seed the database with sample data
- ✅ Start MongoDB (if available)

## Option 2: Manual Setup

### 1. Backend Setup

```bash
cd backend
npm install
cp config.env.example config.env
# Edit config.env with your settings
npm run seed  # Seed database with sample data
npm run dev   # Start backend server
```

### 2. Frontend Setup

```bash
cd musicfrontend
npm install
# Create .env file with REACT_APP_API_URL=http://localhost:5000/api
npm run dev   # Start frontend server
```

### 3. Access the Application

Open your browser and go to: **http://localhost:3000**

## 🔑 Demo Credentials

- **Email**: demo@musicapp.com
- **Password**: demo123

## 🎵 Features to Try

1. **Get Recommendations**: Click "Get Smart Recommendations" to see AI-powered suggestions
2. **Search Music**: Use the search bar to find specific tracks
3. **Rate Tracks**: Rate songs to improve recommendations
4. **Create Playlists**: Generate themed playlists (workout, chill, party, etc.)
5. **View Analytics**: Check your music taste insights

## 🛠️ Troubleshooting

### Backend Issues
- Make sure MongoDB is running: `mongod`
- Check if port 5000 is available
- Verify environment variables in `config.env`

### Frontend Issues
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify `.env` file has correct API URL

### Database Issues
- Run `npm run seed` in backend directory
- Check MongoDB connection string
- Ensure MongoDB is running

## 📚 Next Steps

1. **Spotify Integration**: Add your Spotify API credentials for full functionality
2. **Custom Dataset**: Import your own music dataset
3. **Deploy**: Deploy to production using the deployment guide
4. **Customize**: Modify the UI and add new features

## 🆘 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Look at the API documentation in the backend routes
- Check the component documentation in the frontend

---

**Happy listening! 🎶**
