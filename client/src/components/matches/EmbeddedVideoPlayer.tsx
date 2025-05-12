import React, { useState, useRef } from 'react';

interface EmbeddedVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  className?: string;
}

const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Function to play video
  const handlePlay = () => {
    setIsPlaying(true);
    // Use setTimeout to ensure DOM is updated before trying to play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error("Video playback error:", err);
        });
      }
    }, 0);
  };
  
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden aspect-video ${className}`}>
      {!isPlaying ? (
        // Show thumbnail with play button when not playing
        <div className="w-full h-full relative">
          {/* Thumbnail image */}
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
          />
          
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Play button overlay */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/40 hover:bg-black/60 transition-colors"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
            </div>
            <p className="mt-3 text-white font-medium px-4 text-center">{title}</p>
          </div>
        </div>
      ) : (
        // Show direct MP4 player when playing
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          controls
          autoPlay
          playsInline
          preload="auto"
          poster={thumbnailUrl}
          onLoadedData={() => setIsLoading(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default EmbeddedVideoPlayer;