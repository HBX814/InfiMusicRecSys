import React from 'react'
import './EnhancedMusicSearch.css'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
const EnhancedMusicSearch = () => {
  return (
    <div className='Enhanced'>
      <h2><TrackChangesIcon/>Enhanced Music Search</h2>
      <div className="Search">
        <div className="Search_text">Search Music</div>
        <TextField color='secondary' id="outlined-basic" label="Music Name" variant="outlined" />
      </div>
       <Button variant="contained" className="SButton" color="secondary"> Search </Button>
    </div>
  )
}

export default EnhancedMusicSearch
