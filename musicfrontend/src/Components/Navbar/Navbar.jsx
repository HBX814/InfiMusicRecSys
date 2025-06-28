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
