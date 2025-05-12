import React from 'react';
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
  // This is a sample YouTube embed URL - normally would fetch from API
  const videoUrl = `https://www.youtube.com/embed/videoseries?list=PLW5qT4HIAd1ZYRPJcJZNxK9nIToZnq-Uj`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 bg-black rounded-lg overflow-hidden">
        <div className="relative pt-[56.25%] w-full">
          <iframe 
            src={videoUrl}
            title={`${homeTeam} vs ${awayTeam} Highlights`}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-4 bg-gradient-to-t from-black to-transparent absolute bottom-0 w-full flex justify-center">
          <Button 
            onClick={onClose}
            variant="outline" 
            className="bg-white hover:bg-white/90 text-black rounded-full"
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