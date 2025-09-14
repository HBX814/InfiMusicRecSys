import React from 'react'
import './SystemSetup.css'
import BuildIcon from '@mui/icons-material/Build';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';


const SystemSetup = () => {
  return (
     <div className="SystemSetup">
        <h2><BuildIcon/>System Setup</h2>
        <div className="dataset">
            <div className="dataset_path">Dataset Path</div>
             <TextField id="filled-basic" label="Enter dataset path" variant="filled" color="secondary" />
        </div>
        <div className="spotify_client">
            <div className="spotify_client_ID">
                 <div className="spotify_client_ID_text">Spotify CLient ID(Optional)</div>
                 <TextField id="filled-password-input" label="Enter ID" variant="filled" type='password' autoComplete='current-password' color="secondary" />
            </div>
            <div className="spotify_client_secret">
                 <div className="spotify_client_secret_text">Spotify CLient Secret(Optional)</div>
                 <TextField id="filled-password-input" label="Enter Secret" variant="filled" type='password' autoComplete='current-password' color="secondary"/>
            </div>
        </div>
        <Button variant="contained" className="SSButton" color="secondary"> Initialize Enhanced System </Button>
     </div>
  )
}

export default SystemSetup
