import React from 'react'
import './MusicAnalytics.css'
import Button from '@mui/material/Button';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
const MusicAnalytics = () => {
  return (
    <div className='MusicAnalytics'>
      <h2><AutoGraphIcon/>Your Music Analytics</h2>
      <Button variant="contained" className="RTButton" color="secondary">Get Detailed Analytics</Button>
    </div>
  )
}

export default MusicAnalytics
