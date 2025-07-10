
import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc = "/assets/fallback-logo.svg",
  placeholder,
  rootMargin = '50px',
  threshold = 0.1,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStable, setIsStable] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isStable) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isStable) {
          setIsVisible(true);
          setImageSrc(src);
          setIsStable(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [src, rootMargin, threshold, isStable]);

  const handleLoad = () => {
    if (!isStable) {
      setIsLoaded(true);
      setIsStable(true);
    }
  };

  const handleError = () => {
    // Prevent error handling to avoid re-rendering and logo updates
    return;
  };

  const defaultPlaceholder = (
    <div 
      className={`bg-transparent animate-pulse flex items-center justify-center ${className}`}
      style={{ aspectRatio: '1/1' }}
    >
      <div className="w-4 h-4 bg-transparent rounded"></div>
    </div>
  );

  return (
    <div ref={containerRef} className={className}>
      {isVisible && imageSrc ? (
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  );
};

export default LazyImage;
