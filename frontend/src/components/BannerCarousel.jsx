import { useState, useEffect, useRef } from 'react';

const BannerCarousel = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimerRef = useRef(null);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % banners.length);
      }, 5000);
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, banners.length]);

  return (
    <div 
      className="banner"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="banner-main" id="bannerMain">
        {banners.map((banner, idx) => (
          <img 
            key={idx}
            src={banner} 
            alt={`Banner ${idx + 1}`}
            className={currentSlide === idx ? 'active' : ''}
          />
        ))}
      </div>

      <div className="banner-thumbs" id="bannerThumbs">
        {banners.map((banner, idx) => (
          <button 
            key={idx}
            className={`thumb ${currentSlide === idx ? 'active' : ''}`}
            data-idx={idx}
            onClick={() => {
              setCurrentSlide(idx);
              setIsAutoPlaying(true);
            }}
          >
            <img src={banner} alt={`Banner ${idx + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
