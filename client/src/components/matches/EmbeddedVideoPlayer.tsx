import React, { useEffect, useState, useRef } from 'react';

interface EmbeddedVideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
}

const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  videoId,
  title,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [videoId]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // YouTube embed URL with parameters for better video player appearance
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&fs=1`;

  return (
    <div className={`relative aspect-video ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-center">Video unavailable</p>
          <p className="text-sm text-slate-400 mt-1">Try refreshing or check back later</p>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className={`absolute top-0 left-0 w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default EmbeddedVideoPlayer;