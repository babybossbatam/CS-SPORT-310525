import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  // Function to open YouTube directly
  const openYouTube = () => {
    if (hasVideo) {
      // Open in a new tab
      window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank');
    } else {
      // If no video available, show a message instead
      alert("No highlights available for this match yet.");
    }
  };
  
  // When videoId changes, reset states
  useEffect(() => {
    setIsLoading(true);
    setUseFallbackThumbnail(false);
  }, [videoId]);
  
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden aspect-video ${className}`}>
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
        
        {/* Info overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <div className="text-center px-6 py-4 max-w-md">
            <h3 className="text-white text-xl font-bold mb-3">{title}</h3>
            
            {hasVideo ? (
              <>
                <p className="text-gray-300 mb-4 text-sm">
                  Due to YouTube embedding restrictions, this highlight can only be viewed directly on YouTube.
                </p>
                <Button 
                  onClick={openYouTube}
                  variant="default" 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Watch on YouTube
                </Button>
              </>
            ) : (
              <p className="text-white">No highlights available for this match yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedVideoPlayer;