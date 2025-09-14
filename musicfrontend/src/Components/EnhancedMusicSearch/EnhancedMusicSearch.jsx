import React, { useState } from 'react'; // ✅ Fix: import useState
import './EnhancedMusicSearch.css';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

const EnhancedMusicSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  return (
    <div className='Enhanced'>
      <h2><TrackChangesIcon /> Enhanced Music Search</h2>
      <div className="Search">
        <div className="Search_text">Search Music</div>
        <TextField
          color='secondary'
          id="outlined-basic"
          label="Music Name"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button
        variant="contained"
        className="SButton"
        color="secondary"
        onClick={handleSearch}
        style={{ marginTop: '1rem' }}
      >
        Search
      </Button>

      <ul style={{ marginTop: "2rem", fontSize: "1.1rem" }}>
        {results.map((track, index) => (
          <li key={index}>{track}</li>
        ))}
      </ul>
    </div>
  );
};

export default EnhancedMusicSearch;