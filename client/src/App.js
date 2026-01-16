import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Uploader from './Uploader';
import Feed from './feed';

function App() {
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState("");

  // 1. Initial Load
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/images');
      setImages(res.data);
    } catch (err) {
      console.error("Error fetching images", err);
    }
  };

  // 2. WebSocket Connection for Real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');

    ws.onopen = () => console.log("Connected to WS");

    ws.onmessage = (event) => {
      const newImage = JSON.parse(event.data);
      console.log("New image received via WS:", newImage);
      // Add new image to top of feed
      setImages(prev => [newImage, ...prev]);
    };

    return () => ws.close();
  }, []);

  // 3. Fuzzy Filtering
  const filteredImages = images.filter(img => {
    if (!filter) return true;
    const search = filter.toLowerCase();
    // Search in title OR tags
    return img.title.toLowerCase().includes(search) ||
        img.tags.some(tag => tag.toLowerCase().includes(search));
  });

  return (
      <div className="container">
        <h1 className="header">InstaClone</h1>

        <Uploader />

        <input
            className="search-bar"
            type="text"
            placeholder="Search tags or titles..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
        />

        <Feed images={filteredImages} />
      </div>
  );
}

export default App;