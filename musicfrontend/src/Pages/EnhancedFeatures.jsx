import React from 'react';
import { 
  Settings, 
  Zap, 
  Brain, 
  Music, 
  BarChart3, 
  Search, 
  Play, 
  Heart,
  Star,
  TrendingUp,
  Users,
  Clock,
  Shield,
  Palette,
  Smartphone
} from 'lucide-react';

const EnhancedFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Recommendations",
      description: "Advanced machine learning algorithms analyze your listening patterns and preferences to deliver personalized music suggestions.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Music,
      title: "Spotify Integration",
      description: "Seamless integration with Spotify's vast music library, including previews, full tracks, and real-time metadata.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive insights into your music taste, listening patterns, and recommendation accuracy over time.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Intelligent search across tracks, artists, albums, and genres with real-time suggestions and filters.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Play,
      title: "Music Player",
      description: "Built-in music player with preview functionality, playlist management, and seamless playback controls.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Heart,
      title: "Personalized Experience",
      description: "Learn from your interactions to continuously improve recommendations and adapt to your evolving taste.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const technicalFeatures = [
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Lightning-fast recommendation generation using optimized algorithms and caching strategies."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and protected with industry-standard security measures."
    },
    {
      icon: Palette,
      title: "Customizable UI",
      description: "Dark theme with customizable colors and layouts to match your preferences."
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Optimized for all devices - desktop, tablet, and mobile with touch-friendly interfaces."
    },
    {
      icon: Clock,
      title: "Context-Aware",
      description: "Recommendations adapt based on time of day, activity, and current mood."
    },
    {
      icon: Users,
      title: "Social Features",
      description: "Share playlists, discover what friends are listening to, and explore trending music."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          🚀 Enhanced Features
        </h1>
        <p className="text-xl text-dark-300 max-w-3xl mx-auto">
          Discover the powerful features that make our music recommendation system 
          the most advanced and personalized experience available.
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-dark-800 rounded-xl p-6 hover:bg-dark-700 transition-all duration-300 group"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-dark-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Technical Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          🔧 Technical Excellence
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-dark-800/50 rounded-lg p-6 border border-dark-700 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-dark-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-8 mb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          📊 Performance Metrics
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-400 mb-2">99.9%</div>
            <div className="text-dark-300">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-secondary-400 mb-2">&lt;100ms</div>
            <div className="text-dark-300">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">1M+</div>
            <div className="text-dark-300">Tracks Available</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">95%</div>
            <div className="text-dark-300">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          🎯 Ready to Get Started?
        </h2>
        <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
          Experience the future of music discovery with our AI-powered recommendation system. 
          Start exploring personalized music that matches your unique taste.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold">
            Start Exploring Music
          </button>
          <button className="px-8 py-3 border border-primary-500 text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors font-semibold">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeatures;
