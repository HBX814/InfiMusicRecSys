import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import './App.css'
import Navbar from './Components/Navbar/Navbar'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SetupHome from './Pages/SetupHome'
import SmartSearch from './Pages/SmartSearch'
import SmartPlaylists from './Pages/SmartPlaylists'
import Analytics from './Pages/Analytics'
import MusicPlayer from './Pages/MusicPlayer'
import EnhancedFeautures from './Pages/EnhancedFeautures'
import { AuthProvider } from './contexts/AuthContext' // import AuthProvider

function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path='/' element={<SetupHome />} />
            <Route path='/smartsearch' element={<SmartSearch />} />
            <Route path='/smartplaylists' element={<SmartPlaylists />} />
            <Route path='/analytics' element={<Analytics />} />
            <Route path='/musicplayer' element={<MusicPlayer />} />
            <Route path='/enhancedfeatures' element={<EnhancedFeautures />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App