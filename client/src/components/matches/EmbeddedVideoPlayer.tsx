import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmbeddedVideoPlayerProps {
  videoUrl?: string;
  videoId?: string;
  thumbnailUrl: string;
  title: string;
  className?: string;
}

const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  title,
  className = ''
}) => {
  // Function to open YouTube search for highlights
  const searchYouTube = () => {
    // Create a search query based on the title
    const searchQuery = encodeURIComponent(`${title} football highlights`);
    // Open YouTube search in a new tab
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
  };
  
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden aspect-video ${className}`}>
      <div className="w-full h-full relative bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Static content that doesn't make API calls */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <div className="text-center px-6 py-4 max-w-md">
            <h3 className="text-white text-xl font-bold mb-3">{title}</h3>
            
            <p className="text-gray-300 mb-4 text-sm">
              Click below to search for match highlights on YouTube
            </p>
            
            <Button 
              onClick={searchYouTube}
              variant="default" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search on YouTube
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedVideoPlayer;