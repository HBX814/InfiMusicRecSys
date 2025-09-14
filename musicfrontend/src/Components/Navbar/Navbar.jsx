<<<<<<< HEAD
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Music, 
  Home, 
  Search, 
  SquareLibrary, 
  BarChart3, 
  Play, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/smartsearch', label: 'Search', icon: Search },
    { path: '/smartplaylists', label: 'Playlists', icon: SquareLibrary},
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const additionalItems = [
    { path: '/musicplayer', label: 'Music Player', icon: Play },
    { path: '/spotify', label: 'Spotify AI', icon: Music },
    { path: '/enhancedfeatures', label: 'Features', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    setIsAdditionalOpen(false);
  };

  return (
    <nav className="bg-gray-900 sticky top-0 z-50 border-b border-gray-800 overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white select-none">MusicAI</span>
            </Link>
          </div>

          {/* Center: Navigation Items (Desktop) */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 select-none ${
                    isActive(item.path)
                      ? 'bg-indigo-600 text-indigo-200 border border-indigo-500'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Additional Menu, User Profile, Mobile Menu Button */}
          <div className="flex items-center space-x-4 relative">
            {/* Additional Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAdditionalOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 select-none"
                type="button"
                aria-haspopup="true"
                aria-expanded={isAdditionalOpen}
              >
                <Settings className="h-5 w-5" />
                <ChevronDown className="h-4 w-4" />
              </button>
              {isAdditionalOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-lg py-2 overflow-visible z-50">
                  {additionalItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors select-none"
                        onClick={() => setIsAdditionalOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setIsProfileOpen((prev) => !prev);
                      setIsAdditionalOpen(false);
                    }}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 select-none"
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isProfileOpen}
                  >
                    <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden sm:flex flex-col text-left min-w-[8rem] max-w-xs overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-lg py-2 overflow-visible z-50">
                      <div className="px-4 py-2 border-b border-gray-800">
                        <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-red-500 hover:text-red-400 hover:bg-red-600/20 transition-colors select-none"
                        type="button"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 select-none min-w-[6rem] justify-center"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsAdditionalOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  <User className="h-6 w-6" />
                  <span className="hidden sm:block font-medium">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMenuOpen((prev) => !prev);
                setIsProfileOpen(false);
                setIsAdditionalOpen(false);
              }}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
              type="button"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 py-4 overflow-visible">
            <div className="flex flex-col space-y-2 px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 select-none ${
                      isActive(item.path)
                        ? 'bg-indigo-600 text-indigo-200 border border-indigo-500'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {additionalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 select-none"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-red-500 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors select-none"
                  type="button"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 select-none"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
=======
import React from 'react'
import './Navbar.css'
import { useState } from 'react';
import logo from '../Assets/Music_logo.png'
// import MoreVertIcon from '@mui/icons-material/MoreVert';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { Link } from 'react-router-dom';
const Navbar = () => {
   const [menu,setMenu]=useState("Setup&Home");
  return (
    <div className='navbar'>
      <div className='nav_logo'>
        <img src={logo} alt='' />
        <p>Music</p>
      </div>
      <ul className="nav_menu">
        <li onClick={()=>{setMenu("Setup&Home")}}><Link to='/' style={{textDecoration:'none'}}><HomeIcon/>Setup & Home </Link>{menu==="Setup&Home"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("SmartSearch")}}><Link to='/smartsearch' style={{textDecoration:'none'}}><SearchIcon/>Smart Search</Link>{menu==="SmartSearch"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("SmartPlaylists")}}><Link to='/smartplaylists'style={{textDecoration:'none'}}><LibraryMusicIcon/>Smart Playlists</Link>{menu==="SmartPlaylists"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("Analytics")}}><Link to='/analytics'style={{textDecoration:'none'}}><AnalyticsIcon/>Analytics</Link>{menu==="Analytics"?<hr/>:<></>}</li>
      </ul>
      {/* <MoreVertIcon className='others_icon'/> */}
      <Fab size="small" color="secondary" aria-label="add" className='others_icon'>
        <AddIcon />
      </Fab>
      <div className="nav_others">
        <div className='dropdown'>
        <ul className='drop_list'>
           <li onClick={()=>{setMenu("MusicPlayer")}} ><Link to='/musicplayer' style={{textDecoration:'none'}}>Music Player</Link>{menu==="MusicPlayer"?<hr/>:<></>}</li>
           <li onClick={()=>{setMenu("EnhancedFeatures")}} ><Link to='/enhancedfeatures'style={{textDecoration:'none'}} >Enhanced Features</Link>{menu==="EnhancedFeatures"?<hr/>:<></>}</li>
        </ul>
      </div>
      </div>
    </div>
  )
}

export default Navbar
>>>>>>> fed7901a2c000602d6bef5c50efc6dd76f7955be
