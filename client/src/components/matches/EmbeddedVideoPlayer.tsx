import React, { useState } from 'react';

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
  
  // Default fallback - this can be customized with an actual match highlight video ID
  // Many official match highlights are region-restricted or content-protected, making them hard to embed
  // This component accepts a videoId prop that will override this default
  const youtubeVideoId = ""; // Empty by default - will show "No video available" text if no ID is provided
  const youtubeThumbnail = videoId ? 
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 
    "https://via.placeholder.com/640x360?text=No+video+available";
  
  // Function to play video - only if we have a videoId
  const handlePlay = () => {
    if (videoId || youtubeVideoId) {
      setIsPlaying(true);
    } else {
      // If no video available, show a message instead of playing
      alert("No highlights available for this match yet.");
    }
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
              {videoId ? title : "No highlights available yet"}
            </p>
          </div>
        </div>
      ) : (
        // Only show YouTube embed if we have a videoId
        videoId || youtubeVideoId ? (
          <iframe 
            className="absolute top-0 left-0 w-full h-full border-0"
            src={`https://www.youtube.com/embed/${videoId || youtubeVideoId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          ></iframe>
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