import React, { useState } from 'react';
import axios from 'axios';

export default function Uploader() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if(!file) return alert("Please select a file");
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Please use JPEG, PNG, or GIF images.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("title", title);

        // Split tags by comma, trim whitespace
        tags.split(',').forEach(tag => {
            if(tag.trim()) formData.append("tags", tag.trim());
        });

        try {
            await axios.post('http://localhost:8080/api/uploads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Reset form
            setTitle("");
            setTags("");
            setFile(null);
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
            // Note: We don't manually fetch images here.
            // We wait for the Websocket to tell us the image is processed!
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || "Upload failed. Please try again.";
            console.error("Upload error:", err);
            alert(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="uploader">
            <h3>Upload Post</h3>
            <input 
                type="file" 
                accept="image/jpeg,image/png,image/gif"
                onChange={e => setFile(e.target.files[0])} 
            />
            <input
                type="text"
                placeholder="Caption / Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <input
                type="text"
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
            />
            <button disabled={uploading} onClick={handleUpload}>
                {uploading ? "Processing..." : "Share"}
            </button>
        </div>
    );
}