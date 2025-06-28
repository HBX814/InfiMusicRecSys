import React from 'react'
import { useState } from 'react';
import './Recommendations.css';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
const Recommendations = () => {
   const [genre, setGenre] = useState('');

  const handleChange = (event) => {
    setGenre(event.target.value);
  };

  return (
    <div className="Recommendations">
       <h2><MusicNoteIcon/>Get Recommendations</h2>
          <div className="Listening_content">
            <div className="Listening_content_text">
              Listening Content
            </div>
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
          <MenuItem value={10}>General</MenuItem>
          <MenuItem value={20}>Workout</MenuItem>
          <MenuItem value={30}>Chill</MenuItem>
          <MenuItem value={40}>Party</MenuItem>
          <MenuItem value={50}>Focus</MenuItem>
          <MenuItem value={60}>Sleep</MenuItem>
        </Select>
      </FormControl>
    </Box>
    </div>
          <Button variant="contained" className="GRButton" color="secondary"> Get Smart Recommendations </Button>
    </div>
  )
}

export default Recommendations
