#!/bin/bash

# Music Recommendation System Setup Script
# This script will help you set up the entire project

echo "🎵 Music Recommendation System Setup"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js (v16 or higher) from https://nodejs.org/"
        exit 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "MongoDB is installed"
    else
        print_warning "MongoDB is not installed. Please install MongoDB from https://www.mongodb.com/try/download/community"
        print_info "You can also use MongoDB Atlas (cloud) instead of local installation"
    fi
}

# Check if Python is installed
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_status "Python is installed: $PYTHON_VERSION"
    else
        print_warning "Python is not installed. This is optional for ML features."
    fi
}

# Setup backend
setup_backend() {
    echo ""
    print_info "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    if npm install; then
        print_status "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    # Create config file if it doesn't exist
    if [ ! -f "config.env" ]; then
        print_info "Creating config.env file..."
        cat > config.env << EOF
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/music_recommendation
MONGODB_TEST_URI=mongodb://localhost:27017/music_recommendation_test

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_$(date +%s)
JWT_EXPIRE=7d

# Spotify API Configuration (Optional)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
        print_status "Created config.env file"
    else
        print_info "config.env already exists"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    echo ""
    print_info "Setting up frontend..."
    
    cd musicfrontend
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    if npm install; then
        print_status "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_info "Creating .env file..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF
        print_status "Created .env file"
    else
        print_info ".env already exists"
    fi
    
    cd ..
}

# Setup ML model (optional)
setup_ml() {
    echo ""
    print_info "Setting up ML model (optional)..."
    
    if command -v python3 &> /dev/null; then
        print_info "Installing Python dependencies for ML model..."
        cd backend/ml_scripts
        if pip3 install -r requirements.txt; then
            print_status "ML dependencies installed"
        else
            print_warning "Failed to install ML dependencies. You can install them manually later."
        fi
        cd ../..
        
        # Test ML script
        print_info "Testing ML recommendation engine..."
        if python3 backend/ml_scripts/recommendation_engine.py '{"user_data": {}, "tracks_data": []}' 2>/dev/null; then
            print_status "ML engine test passed"
        else
            print_warning "ML engine test failed. Check Python dependencies."
        fi
    else
        print_warning "Python not found. Skipping ML setup."
        print_info "To enable ML features, install Python 3.8+ and run:"
        print_info "  cd backend/ml_scripts && pip3 install -r requirements.txt"
    fi
}

# Start services
start_services() {
    echo ""
    print_info "Starting services..."
    
    # Start MongoDB if available
    if command -v mongod &> /dev/null; then
        print_info "Starting MongoDB..."
        if pgrep -x "mongod" > /dev/null; then
            print_status "MongoDB is already running"
        else
            print_info "Starting MongoDB in background..."
            mongod --fork --logpath /tmp/mongod.log
            sleep 2
            if pgrep -x "mongod" > /dev/null; then
                print_status "MongoDB started successfully"
            else
                print_warning "Failed to start MongoDB. Please start it manually."
            fi
        fi
    else
        print_warning "MongoDB not found. Please start MongoDB manually or use MongoDB Atlas."
    fi
    
    # Seed database
    print_info "Seeding database with sample data..."
    cd backend
    if npm run seed; then
        print_status "Database seeded successfully"
    else
        print_warning "Failed to seed database. You can run 'npm run seed' manually later."
    fi
    cd ..
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    # Check prerequisites
    check_node
    check_mongodb
    check_python
    
    # Setup components
    setup_backend
    setup_frontend
    setup_ml
    start_services
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start the backend server:"
    echo "   cd backend && npm run dev"
    echo ""
    echo "2. Start the frontend server (in a new terminal):"
    echo "   cd musicfrontend && npm run dev"
    echo ""
    echo "3. Open your browser and go to:"
    echo "   http://localhost:3000"
    echo ""
    echo "🔑 Demo credentials:"
    echo "   Email: demo@musicapp.com"
    echo "   Password: demo123"
    echo ""
    echo "📚 For more information, check the README.md file"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main
