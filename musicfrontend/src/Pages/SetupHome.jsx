import React from 'react'
import SystemSetup from '../Components/SystemSetup/SystemSetup'
import Recommendations from '../Components/Recommendations/Recommendations'
import RateATrack from '../Components/RateATrack/RateATrack'


const SetupHome = () => {
  return (
    <div className='SetupHome'>
      <SystemSetup/>
      <Recommendations/>
      <RateATrack/>
    </div>
  )
}

export default SetupHome
