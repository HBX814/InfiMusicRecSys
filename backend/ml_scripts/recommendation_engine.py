#!/usr/bin/env python3
"""
Music Recommendation Engine
Integrates the ML model from the Jupyter notebook into the Node.js backend
"""

import sys
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
import warnings
from datetime import datetime
from collections import defaultdict, Counter
import re
import pickle
from typing import List, Dict, Tuple, Optional

warnings.filterwarnings('ignore')

class MusicRecommendationEngine:
    def __init__(self, spotify_client_id=None, spotify_client_secret=None):
        self.df = None
        self.feature_columns = [
            'danceability', 'energy', 'key', 'loudness', 'mode',
            'speechiness', 'acousticness', 'instrumentalness',
            'liveness', 'valence', 'tempo', 'duration_ms', 'time_signature'
        ]
        
        # ML Models
        self.scaler = StandardScaler()
        self.minmax_scaler = MinMaxScaler()
        self.similarity_matrix = None
        self.pca = None
        self.kmeans = None
        
        # User modeling
        self.user_preferences = None
        self.user_history = []
        self.listening_context = defaultdict(list)
        self.user_genre_preferences = Counter()
        
        # Features
        self.features_scaled = None
        self.features_normalized = None
        self.available_features = []
        
        # Spotify API
        self.spotify_client_id = spotify_client_id
        self.spotify_client_secret = spotify_client_secret
        self.spotify = None
        
        # Recommendation weights
        self.hybrid_weights = {'content': 0.6, 'collaborative': 0.3, 'popularity': 0.1}
        
    def initialize_spotify_api(self, client_id, client_secret):
        """Initialize Spotify API"""
        try:
            if not client_id or not client_secret:
                return False
                
            self.spotify_client_id = client_id
            self.spotify_client_secret = client_secret
            
            client_credentials_manager = SpotifyClientCredentials(
                client_id=client_id,
                client_secret=client_secret
            )
            self.spotify = spotipy.Spotify(
                client_credentials_manager=client_credentials_manager,
                requests_timeout=10,
                retries=3
            )
            
            # Test connection
            test = self.spotify.search(q='test', type='track', limit=1)
            return True
        except Exception as e:
            print(f"Spotify API initialization failed: {str(e)}")
            return False
    
    def load_data_from_mongodb(self, tracks_data):
        """Load data from MongoDB tracks"""
        try:
            # Convert MongoDB tracks to DataFrame
            tracks_list = []
            for track in tracks_data:
                track_dict = {
                    'name': track.get('name', ''),
                    'artists': track.get('artists', ['Unknown']),
                    'album': track.get('album', 'Unknown'),
                    'year': track.get('year', 2020),
                    'explicit': track.get('explicit', False),
                    'cluster': track.get('cluster', 0),
                    'popularity_score': track.get('popularity_score', 0)
                }
                
                # Add audio features
                audio_features = track.get('audioFeatures', {})
                for feature in self.feature_columns:
                    track_dict[feature] = audio_features.get(feature, 0.0)
                
                tracks_list.append(track_dict)
            
            self.df = pd.DataFrame(tracks_list)
            
            # Check available features
            self.available_features = [col for col in self.feature_columns if col in self.df.columns]
            
            if len(self.available_features) == 0:
                raise ValueError("No audio features found in the dataset!")
            
            # Add derived features
            self._add_derived_features()
            
            print(f"Dataset loaded: {len(self.df)} tracks with {len(self.available_features)} features")
            return True
            
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            return False
    
    def _add_derived_features(self):
        """Add derived features for better recommendations"""
        if 'energy' in self.available_features and 'valence' in self.available_features:
            self.df['mood_energy'] = self.df['energy'] * self.df['valence']
            self.available_features.append('mood_energy')
        
        if 'danceability' in self.available_features and 'tempo' in self.available_features:
            self.df['dance_tempo'] = self.df['danceability'] * (self.df['tempo'] / 200)
            self.available_features.append('dance_tempo')
        
        if 'acousticness' in self.available_features and 'instrumentalness' in self.available_features:
            self.df['acoustic_instrumental'] = (self.df['acousticness'] + self.df['instrumentalness']) / 2
            self.available_features.append('acoustic_instrumental')
    
    def preprocess_features(self):
        """Preprocess features for ML models"""
        try:
            print("Preprocessing features...")
            
            # Scale features
            features = self.df[self.available_features].values
            self.features_scaled = self.scaler.fit_transform(features)
            self.features_normalized = self.minmax_scaler.fit_transform(features)
            
            # Apply PCA for dimensionality reduction
            n_features = len(self.available_features)
            if n_features > 5:
                n_components = min(max(5, n_features // 2), 50)
                self.pca = PCA(n_components=n_components)
                self.features_scaled = self.pca.fit_transform(self.features_scaled)
                print(f"PCA applied: reduced from {n_features} to {n_components} dimensions")
            
            # Apply clustering
            n_clusters = min(20, max(5, len(self.df) // 1000))
            self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            self.df['cluster'] = self.kmeans.fit_predict(self.features_scaled)
            
            print("Preprocessing completed")
            return True
            
        except Exception as e:
            print(f"Error preprocessing features: {str(e)}")
            return False
    
    def build_similarity_matrix(self, sample_size=50000):
        """Build similarity matrix for content-based filtering"""
        try:
            print("Building similarity matrix...")
            
            # Sample for memory efficiency
            if len(self.df) > sample_size:
                sample_indices = np.random.choice(len(self.df), sample_size, replace=False)
                sample_features = self.features_scaled[sample_indices]
                self.sample_indices = sample_indices
            else:
                sample_features = self.features_scaled
                self.sample_indices = np.arange(len(self.df))
            
            # Compute cosine similarity
            self.similarity_matrix = cosine_similarity(sample_features)
            print("Similarity matrix built")
            return True
            
        except Exception as e:
            print(f"Error building similarity matrix: {str(e)}")
            return False
    
    def get_hybrid_recommendations(self, user_data, context='general', limit=20):
        """Get hybrid recommendations using ML models"""
        try:
            if self.df is None or self.similarity_matrix is None:
                return []
            
            recommendations = []
            
            # Extract user preferences
            user_preferences = user_data.get('preferences', {})
            listening_history = user_data.get('listeningHistory', [])
            
            # Content-based recommendations
            if listening_history:
                recent_track_indices = [track.get('trackId') for track in listening_history[-10:]]
                content_recs = self._get_content_based_recommendations(recent_track_indices, limit)
                recommendations.extend([(idx, 'content') for idx in content_recs])
            
            # Collaborative filtering
            if user_preferences.get('audioFeatures'):
                collab_recs = self._get_collaborative_recommendations(user_preferences, limit)
                recommendations.extend([(idx, 'collaborative') for idx in collab_recs])
            
            # Context-aware recommendations
            context_recs = self._get_context_aware_recommendations(context, limit)
            recommendations.extend([(idx, 'context') for idx in context_recs])
            
            # Popularity-based recommendations
            popular_recs = self._get_popularity_recommendations(limit)
            recommendations.extend([(idx, 'popularity') for idx in popular_recs])
            
            # Rank and combine recommendations
            final_recs = self._rank_hybrid_recommendations(recommendations, limit)
            
            # Format results
            formatted_recommendations = []
            for idx in final_recs:
                if idx < len(self.df):
                    track = self.df.iloc[idx]
                    formatted_recommendations.append({
                        'id': str(idx),
                        'track_name': track['name'],
                        'artist_name': track['artists'][0] if isinstance(track['artists'], list) else str(track['artists']),
                        'album': track['album'],
                        'year': track['year'],
                        'explicit': track['explicit'],
                        'audio_features': {feature: track.get(feature, 0) for feature in self.available_features},
                        'cluster': track['cluster'],
                        'popularity_score': track['popularity_score']
                    })
            
            return formatted_recommendations
            
        except Exception as e:
            print(f"Error getting recommendations: {str(e)}")
            return []
    
    def _get_content_based_recommendations(self, track_indices, limit):
        """Content-based filtering recommendations"""
        if not track_indices or self.similarity_matrix is None:
            return []
        
        try:
            # Get average features of recent tracks
            recent_features = []
            for idx in track_indices:
                if isinstance(idx, str):
                    idx = int(idx)
                if idx < len(self.df):
                    recent_features.append(self.features_scaled[idx])
            
            if not recent_features:
                return []
            
            avg_features = np.mean(recent_features, axis=0)
            
            # Find similar tracks
            similarities = cosine_similarity([avg_features], self.features_scaled)[0]
            similar_indices = np.argsort(similarities)[::-1][:limit*2]
            
            # Filter out already heard tracks
            heard_tracks = set(track_indices)
            recommendations = [idx for idx in similar_indices if idx not in heard_tracks]
            
            return recommendations[:limit]
            
        except Exception as e:
            print(f"Error in content-based recommendations: {str(e)}")
            return []
    
    def _get_collaborative_recommendations(self, user_preferences, limit):
        """Collaborative filtering recommendations"""
        try:
            audio_features = user_preferences.get('audioFeatures', {})
            if not audio_features:
                return []
            
            # Create user preference vector
            user_vector = []
            for feature in self.available_features:
                user_vector.append(audio_features.get(feature, 0.5))
            
            user_vector = np.array(user_vector).reshape(1, -1)
            
            # Find similar users based on preferences
            similarities = cosine_similarity(user_vector, self.features_scaled)[0]
            similar_indices = np.argsort(similarities)[::-1][:limit*2]
            
            return similar_indices[:limit]
            
        except Exception as e:
            print(f"Error in collaborative recommendations: {str(e)}")
            return []
    
    def _get_context_aware_recommendations(self, context, limit):
        """Context-aware recommendations"""
        context_filters = {
            'workout': {'energy': (0.7, 1.0), 'tempo': (120, 200)},
            'chill': {'energy': (0.0, 0.5), 'valence': (0.3, 0.8)},
            'party': {'danceability': (0.7, 1.0), 'energy': (0.7, 1.0)},
            'focus': {'instrumentalness': (0.5, 1.0), 'speechiness': (0.0, 0.3)},
            'sleep': {'energy': (0.0, 0.3), 'tempo': (60, 100)},
            'general': {}
        }
        
        filters = context_filters.get(context, {})
        if not filters:
            return []
        
        try:
            mask = pd.Series(True, index=self.df.index)
            
            for feature, (min_val, max_val) in filters.items():
                if feature in self.available_features:
                    mask &= (self.df[feature] >= min_val) & (self.df[feature] <= max_val)
            
            filtered_indices = self.df[mask].index.tolist()
            return np.random.choice(filtered_indices, min(limit, len(filtered_indices)), replace=False).tolist()
            
        except Exception as e:
            print(f"Error in context-aware recommendations: {str(e)}")
            return []
    
    def _get_popularity_recommendations(self, limit):
        """Popularity-based recommendations"""
        try:
            if 'popularity_score' in self.df.columns:
                popular_tracks = self.df.nlargest(limit * 2, 'popularity_score')
            else:
                # Use random sampling
                popular_tracks = self.df.sample(min(limit * 2, len(self.df)))
            
            return popular_tracks.index.tolist()[:limit]
            
        except Exception as e:
            print(f"Error in popularity recommendations: {str(e)}")
            return []
    
    def _rank_hybrid_recommendations(self, recommendations, limit):
        """Rank and combine recommendations from different sources"""
        try:
            rec_scores = defaultdict(float)
            rec_sources = defaultdict(list)
            
            for track_idx, source in recommendations:
                weight = self.hybrid_weights.get(source, 0.1)
                rec_scores[track_idx] += weight
                rec_sources[track_idx].append(source)
            
            # Boost tracks recommended by multiple sources
            for track_idx, sources in rec_sources.items():
                if len(sources) > 1:
                    rec_scores[track_idx] *= 1.2
            
            # Sort by score and remove duplicates
            sorted_recs = sorted(rec_scores.items(), key=lambda x: x[1], reverse=True)
            final_recs = [track_idx for track_idx, _ in sorted_recs[:limit]]
            
            return final_recs
            
        except Exception as e:
            print(f"Error ranking recommendations: {str(e)}")
            return []

def main():
    """Main function to handle ML recommendation requests"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.argv[1])
        
        # Initialize recommendation engine
        engine = MusicRecommendationEngine()
        
        # Load data from MongoDB (this would be passed from Node.js)
        tracks_data = input_data.get('tracks_data', [])
        if not tracks_data:
            print(json.dumps({"error": "No tracks data provided"}))
            return
        
        # Initialize with tracks data
        if not engine.load_data_from_mongodb(tracks_data):
            print(json.dumps({"error": "Failed to load tracks data"}))
            return
        
        # Preprocess features
        if not engine.preprocess_features():
            print(json.dumps({"error": "Failed to preprocess features"}))
            return
        
        # Build similarity matrix
        if not engine.build_similarity_matrix():
            print(json.dumps({"error": "Failed to build similarity matrix"}))
            return
        
        # Get recommendations
        user_data = input_data.get('user_data', {})
        context = input_data.get('context', 'general')
        limit = input_data.get('limit', 20)
        
        recommendations = engine.get_hybrid_recommendations(user_data, context, limit)
        
        # Prepare response
        response = {
            "tracks": recommendations,
            "insights": {
                "total_tracks_processed": len(engine.df),
                "features_used": len(engine.available_features),
                "clusters_created": engine.kmeans.n_clusters if engine.kmeans else 0,
                "recommendation_engine": "hybrid_ml"
            }
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        error_response = {
            "error": f"ML recommendation error: {str(e)}",
            "tracks": [],
            "insights": {}
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    main()
