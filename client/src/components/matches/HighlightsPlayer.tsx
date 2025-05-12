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
  isLiveStream?: boolean;
}

const HighlightsPlayer: React.FC<HighlightsPlayerProps> = ({
  isOpen,
  onClose,
  matchId,
  homeTeam,
  awayTeam,
  isLiveStream = false
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  
  // Fetch video URL based on teams
  useEffect(() => {
    if (isLiveStream) {
      // Live stream URLs for various teams/leagues
      const liveStreamSources: Record<string, string> = {
        // Premier League teams
        'Manchester City': 'K-38s5k_hUE',
        'Arsenal': 'K-38s5k_hUE',
        'Liverpool': 'K-38s5k_hUE',
        'Manchester United': 'K-38s5k_hUE',
        'Chelsea': 'K-38s5k_hUE',
        
        // Serie A teams
        'Inter': 'K-38s5k_hUE',
        'Milan': 'K-38s5k_hUE',
        'Juventus': 'K-38s5k_hUE',
        'Roma': 'K-38s5k_hUE',
        
        // Default live stream
        'default': 'K-38s5k_hUE' // LiveNow football channel ID
      };
      
      // Try to find a live stream for one of the teams
      const homeTeamStream = liveStreamSources[homeTeam as keyof typeof liveStreamSources] || '';
      const awayTeamStream = liveStreamSources[awayTeam as keyof typeof liveStreamSources] || '';
      
      // Use team-specific stream if available, otherwise use default
      const streamId = homeTeamStream || awayTeamStream || liveStreamSources['default'];
      
      setVideoUrl(`https://www.youtube.com/embed/${streamId}?autoplay=1`);
      setTitle(`${homeTeam} vs ${awayTeam} - Live Match`);
    } else {
      // Highlight videos for various teams
      const highlightVideos: Record<string, string> = {
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
      const homeTeamPlaylist = highlightVideos[homeTeam as keyof typeof highlightVideos] || '';
      const awayTeamPlaylist = highlightVideos[awayTeam as keyof typeof highlightVideos] || '';
      
      // Use team-specific playlist if available, otherwise use default
      const playlistId = homeTeamPlaylist || awayTeamPlaylist || highlightVideos['default'];
      
      setVideoUrl(`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`);
      setTitle(`${homeTeam} vs ${awayTeam} Highlights`);
    }
  }, [matchId, homeTeam, awayTeam, isLiveStream]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 bg-black rounded-lg overflow-hidden border-0">
        <div className="relative pt-[56.25%] w-full">
          {videoUrl && (
            <iframe 
              src={videoUrl}
              title={title}
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
            Close {isLiveStream ? 'Live Stream' : 'Highlights'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HighlightsPlayer;