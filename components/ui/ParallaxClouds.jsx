"use client";
import { useEffect, useRef } from 'react';

const ParallaxClouds = () => {
  const cloudContainerRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!cloudContainerRef.current) return;
      
      const scrollY = window.scrollY;
      const clouds = cloudContainerRef.current.querySelectorAll('.cloud');
      
      const speedFactors = [0.1, 0.3, 0.5];
      
      clouds.forEach((cloud, index) => {
        let layer = 0;
        if (index < 2) layer = 0;
        else if (index < 4) layer = 1;
        else layer = 2;
        
        const translateY = -scrollY * speedFactors[layer];
        cloud.style.transform = `translateY(${translateY}px)`;
      });
    };
    
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      ref={cloudContainerRef}
      className="cloud-parallax-container"
    >
      {/* Nubes mas pequeñas */}
      <div className="cloud cloud-layer-1" style={{ top: '10%', left: '5%' }}></div>
      <div className="cloud cloud-layer-1" style={{ top: '40%', right: '10%' }}></div>
      
      {/* Nubes de tamaño medio */}
      <div className="cloud cloud-layer-2" style={{ top: '80%', left: '20%' }}></div>
      <div className="cloud cloud-layer-2" style={{ top: '20%', right: '5%' }}></div>
      
      {/* Nubes cercanas, las más grandes */}
      <div className="cloud cloud-layer-3" style={{ top: '60%', left: '10%' }}></div>
      <div className="cloud cloud-layer-3" style={{ top: '100%', right: '20%' }}></div>
    </div>
  );
};

export default ParallaxClouds;