import React from 'react'
import { useState } from 'react';
import './RateATrack.css'
import FavoriteIcon from '@mui/icons-material/Favorite';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';

import { colors, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
const RateATrack = () => {
 const [genre, setGenre] = useState('');
 const [value, setValue] = useState(0);

  const handleChange = (event) => {
    setGenre(event.target.value);
  };

   const [count, setCount] = useState(0);

  return (
    <div className="RateATrack">
      <h2><FavoriteIcon/>Rate a Track</h2>
      <div className="Track">
          <div className="TrackNumber">
             <div className="TrackNumberText">Track Number</div>
             <div className="counter-container">
      <IconButton onClick={() => setCount(count - 1)} color="secondary">
        <RemoveIcon />
      </IconButton>
      <div className="counter-value">{count}</div>
      <IconButton onClick={() => setCount(count + 1)} color="secondary">
        <AddIcon />
      </IconButton>
    </div>
          </div>
          <div className="Rating">
              <div className="RatingText">Rating</div>
               <Rating
               size='large'
        name="simple-controlled"
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      />
          </div>
          <div className="Context">
             <div className="ContextText">Context</div>
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
      </div>
<Button variant="contained" className="RTButton" color="secondary">Rate Track</Button>
    </div>
  )
}

export default RateATrack
