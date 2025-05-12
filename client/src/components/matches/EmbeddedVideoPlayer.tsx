import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface EmbeddedVideoPlayerProps {
  videoUrl?: string;
  videoId?: string;
  thumbnailUrl: string;
  title: string;
  className?: string;
}

const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  videoUrl,
  videoId,
  thumbnailUrl,
  title,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [useFallbackThumbnail, setUseFallbackThumbnail] = useState(false);
  
  // Use videoId if provided, otherwise empty string
  const youtubeVideoId = videoId || "";
  
  // Try to use the provided thumbnail, but have a fallback
  const youtubeThumbnail = useFallbackThumbnail ? 
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 
    thumbnailUrl;
  
  // Check if the video has a valid ID
  const hasVideo = Boolean(youtubeVideoId);
  
  // Handle image load errors - if API thumbnail fails, try YouTube's default thumbnail
  const handleImageError = () => {
    if (!useFallbackThumbnail && videoId) {
      setUseFallbackThumbnail(true);
    }
  };
  
  // Function to play video - only if we have a videoId
  const handlePlay = () => {
    if (hasVideo) {
      setIsPlaying(true);
      setVideoError(false);
    } else {
      // If no video available, show a message instead of playing
      alert("No highlights available for this match yet.");
    }
  };
  
  // Function to handle video errors
  const handleVideoError = () => {
    setVideoError(true);
    console.error("Video playback error for ID:", videoId);
  };
  
  // When videoId changes, reset states
  useEffect(() => {
    setIsPlaying(false);
    setVideoError(false);
    setIsLoading(true);
    setUseFallbackThumbnail(false);
  }, [videoId]);
  
  // Create YouTube URL with origin parameter for better embedding
  const getYoutubeEmbedUrl = () => {
    const origin = window.location.origin;
    return `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&origin=${origin}`;
  };
  
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden aspect-video ${className}`}>
      {!isPlaying ? (
        // Show thumbnail with play button when not playing
        <div className="w-full h-full relative">
          {/* Thumbnail image */}
          <img 
            src={youtubeThumbnail} 
            alt={title}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
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
            <p className="mt-3 text-white font-medium px-4 text-center">
              {hasVideo ? title : "No highlights available yet"}
            </p>
          </div>
        </div>
      ) : videoError ? (
        // Show error message if video fails to load
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 flex items-center justify-center text-white">
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
            <p className="text-xl text-center px-4 mb-2">Video Unavailable</p>
            <p className="text-sm text-gray-400">
              This video may be restricted in your region or unavailable for embedding.
              <br />
              <a 
                href={`https://www.youtube.com/watch?v=${youtubeVideoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
              >
                Watch on YouTube
              </a>
            </p>
          </div>
        </div>
      ) : (
        // Only show YouTube embed if we have a videoId
        hasVideo ? (
          <div className="relative w-full h-full">
            <iframe 
              className="absolute top-0 left-0 w-full h-full border-0"
              src={getYoutubeEmbedUrl()}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
              onError={handleVideoError}
            ></iframe>
            {/* Loading indicator that disappears when iframe loads */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 iframe-loading">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          </div>
        ) : (
          // Show message if no video available
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900 flex items-center justify-center text-white">
            <p className="text-xl text-center px-4">No highlights available for this match yet.</p>
          </div>
        )
      )}
    </div>
  );
};

export default EmbeddedVideoPlayer;