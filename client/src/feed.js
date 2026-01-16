import React, { useRef, useCallback } from 'react';

export default function Feed({ images }) {
    // Intersection Observer for Infinite Scroll effect
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                console.log("Visible - Load more logic would go here");
            }
        });
        if (node) observer.current.observe(node);
    }, []);

    return (
        <div className="feed">
            {images.map((img, index) => {
                const isLast = index === images.length - 1;
                return (
                    <div
                        ref={isLast ? lastElementRef : null}
                        className="card"
                        key={img.id}
                    >
                        <img src={img.url} alt={img.title} className="card-img" />
                        <div className="card-content">
                            <strong>{img.title}</strong>
                            <div className="tags">
                                {img.tags && img.tags.map((tag, i) => (
                                    <span key={i}>#{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
            {images.length === 0 && <p style={{textAlign:'center'}}>No images found.</p>}
        </div>
    );
}