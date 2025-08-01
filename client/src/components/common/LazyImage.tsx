import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc = '/assets/fallback-logo.svg',
  className = '',
  style = {},
  loading = 'lazy',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isInView, setIsInView] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxRetries = 3;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Load image only when in view
  useEffect(() => {
    if (isInView && src) {
      console.log(`🖼️ [LazyImage] Starting to load (in view): ${src}`);
      setImageSrc(src);
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
    }
  }, [src, isInView]);

  const handleError = () => {
    if (hasError && retryCount >= maxRetries) {
      console.warn(`🚫 [LazyImage] Max retries reached for: ${src}, using fallback`);
      setImageSrc(fallbackSrc);
      return;
    }

    if (retryCount < maxRetries) {
      console.warn(`🖼️ [LazyImage] Failed to load image: ${src}, retry ${retryCount + 1}`);
      const cacheBuster = `?t=${Date.now()}`;
      const freshUrl = src + cacheBuster;
      setImageSrc(freshUrl);
      setRetryCount(retryCount + 1);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Show placeholder until image is in view and loaded
  if (!isInView) {
    return (
      <div
        ref={containerRef}
        className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}
        style={style}
        {...props}
      >
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Show loading state while image loads
  if (isLoading && !imageSrc) {
    return (
      <div
        ref={containerRef}
        className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}
        style={style}
        {...props}
      >
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <img
        ref={imgRef}
        src={imageSrc || fallbackSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        {...props}
      />
    </div>
  );
};

export default LazyImage;