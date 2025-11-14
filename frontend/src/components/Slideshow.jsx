import React, { useState, useEffect } from 'react';

const slides = [
  '/image/1.jpg',
  '/image/2.jpg',
  '/image/3.jpg',
  '/image/4.jpg'
];

export default function Slideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  const isMobile = () => {
    return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
  };

  // Calculate responsive height based on device type
  const getSlideshowHeight = () => {
    if (isMobile()) {
      return '35vh'; // Shorter height for mobile
    }
    return '55vh'; // Original height for desktop
  };

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get responsive button size
  const getButtonSize = () => {
    return isMobile() ? '36px' : '44px';
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      className="slideshow"
      style={{
        width: '100vw',
        position: 'relative',
        boxSizing: 'border-box',
        margin: '0',
        padding: '0',
        left: '-10px',
        right: '0',
        overflow: 'hidden'
      }}
    >
      <img
        src={slides[currentIndex]}
        alt={`slide-${currentIndex}`}
        className="slide-img"
        style={{
          width: '100%',
          height: getSlideshowHeight(),
          objectFit: 'cover',
          display: 'block',
          margin: '0',
          padding: '0'
        }}
      />

      <button
        onClick={prevSlide}
        onMouseEnter={() => setHoverPrev(true)}
        onMouseLeave={() => setHoverPrev(false)}
        style={{
          position: 'absolute',
          top: '50%',
          left: '16px',
          transform: `translateY(-50%) ${hoverPrev ? 'scale(1.05)' : 'scale(1)'}`,
          background: hoverPrev ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
          color: '#fff',
          border: 'none',
          width: getButtonSize(),
          height: getButtonSize(),
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s ease, transform 0.2s ease',
          boxShadow: hoverPrev ? '0 2px 8px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        &lt;
      </button>

      <button
        onClick={nextSlide}
        onMouseEnter={() => setHoverNext(true)}
        onMouseLeave={() => setHoverNext(false)}
        style={{
          position: 'absolute',
          top: '50%',
          right: '16px',
          transform: `translateY(-50%) ${hoverNext ? 'scale(1.05)' : 'scale(1)'}`,
          background: hoverNext ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
          color: '#fff',
          border: 'none',
          width: getButtonSize(),
          height: getButtonSize(),
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s ease, transform 0.2s ease',
          boxShadow: hoverNext ? '0 2px 8px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        &gt;
      </button>
    </section>
  );
}
