import React from 'react'
import './AIPlaylists.css'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useState } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';

function valuetext(value) {
  return `${value}`;
}

const AIPlaylists = () => {

const [genre, setGenre] = useState('');

  const handleChange = (event) => {
    setGenre(event.target.value);
  };

  return (
    < div className='AIPlaylists'>
      <h2><AutoAwesomeIcon/>AI Generated Playlists</h2>
      <div className="Playlist">
        <div className="Playlist_type">
         <div className="Playlist_type_text">Playlist Type</div>
         <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label" color='secondary'>Genre</InputLabel>
        <Select
          color='secondary'
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={genre}
          label="Genre"
          onChange={handleChange}
        >
          <MenuItem value={10}>Throwback</MenuItem>
          <MenuItem value={20}>Workout</MenuItem>
          <MenuItem value={30}>Chill</MenuItem>
          <MenuItem value={40}>Party</MenuItem>
          <MenuItem value={50}>Focus</MenuItem>
          <MenuItem value={60}>Discovery</MenuItem>
        </Select>
      </FormControl>
    </Box>
        </div>
        <div className="TrackNo">
          <div className="TrackNo_text">Number of Tracks</div>
           <Slider defaultValue={30} aria-label="Default" valueLabelDisplay="auto" min={10} max={50} color="secondary"  getAriaValueText={valuetext}/>
        </div>
      </div>
 <Button variant="contained" className="GPButton" color="secondary">Generate Playlists</Button>
    </div>
  )
}

export default AIPlaylists
