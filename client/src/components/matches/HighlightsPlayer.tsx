import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface HighlightsPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string | number;
  homeTeam: string;
  awayTeam: string;
}

const HighlightsPlayer: React.FC<HighlightsPlayerProps> = ({
  isOpen,
  onClose,
  matchId,
  homeTeam,
  awayTeam
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  
  // Fetch video URL based on teams
  useEffect(() => {
    // In a production app, we would fetch the actual highlights from an API endpoint
    // For example: GET /api/fixtures/{matchId}/highlights
    
    // Using a collection of popular football highlight videos for demo purposes
    const highlightVideos = {
      // Premier League teams
      'Manchester City': 'PLW5qT4HIAd1YZnDSU_2k3_LuMvDFPk9M5',
      'Arsenal': 'PLW5qT4HIAd1ZQXpFDM7BwqUu__RzXS7MO', 
      'Liverpool': 'PLW5qT4HIAd1ZkTZkwvVnJaIj81u0ygSFE',
      'Manchester United': 'PLW5qT4HIAd1bKuuXQV-0UBvPxq0Fw4kUU',
      'Chelsea': 'PLW5qT4HIAd1aWYgMwgkY2k_NNHL6aSYRm',
      'Tottenham': 'PLW5qT4HIAd1ZO3mKPw6waR9cecPFLagdY',
      
      // Serie A teams
      'Inter': 'PLW5qT4HIAd1a2aEPBhZdKpNJ-KB0MEwp9',
      'Milan': 'PLW5qT4HIAd1atxwHjTdRzZDya6T0go8xf',
      'Juventus': 'PLW5qT4HIAd1bOdf_1UbuFezSS_FR7MD7D',
      'Roma': 'PLW5qT4HIAd1bFULL-VSiWZH-aL_IvfyHP',
      'Napoli': 'PLW5qT4HIAd1Z-aWxQscmm9NmUHDlVkKLc',
      
      // Default playlist if team not found
      'default': 'PLW5qT4HIAd1ZYRPJcJZNxK9nIToZnq-Uj'
    };
    
    // Try to find a highlight video for one of the teams
    const homeTeamPlaylist = highlightVideos[homeTeam] || '';
    const awayTeamPlaylist = highlightVideos[awayTeam] || '';
    
    // Use team-specific playlist if available, otherwise use default
    const playlistId = homeTeamPlaylist || awayTeamPlaylist || highlightVideos['default'];
    
    setVideoUrl(`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`);
  }, [matchId, homeTeam, awayTeam]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 bg-black rounded-lg overflow-hidden border-0">
        <div className="relative pt-[56.25%] w-full">
          {videoUrl && (
            <iframe 
              src={videoUrl}
              title={`${homeTeam} vs ${awayTeam} Highlights`}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        {/* Close button at the bottom */}
        <div className="p-4 flex justify-center items-center bg-black">
          <Button 
            onClick={onClose}
            variant="outline" 
            className="bg-white hover:bg-white/90 text-black rounded-full px-6"
          >
            <X className="mr-2 h-4 w-4" />
            Close Highlights
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HighlightsPlayer;