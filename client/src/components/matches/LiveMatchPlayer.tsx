import { useState } from 'react';
import { FixtureResponse } from '../../../../server/types';
import { getTeamColor } from '@/lib/colorUtils';
import { Play, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveMatchPlayerProps {
  fixture: FixtureResponse;
  onClose: () => void;
}

const LiveMatchPlayer: React.FC<LiveMatchPlayerProps> = ({ fixture, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Extract team colors for styling
  const homeTeamColor = getTeamColor(fixture.teams.home.logo) || '#e11d48';
  const awayTeamColor = getTeamColor(fixture.teams.away.logo) || '#1e40af';
  
  // Handle play button click
  const handlePlay = () => {
    setIsPlaying(true);
  };
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-black mb-4">
      {/* Close button */}
      <button 
        className="absolute top-2 right-2 z-20 text-white bg-black/50 p-1 rounded-full"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Player content */}
      <div className="aspect-video relative">
        {!isPlaying ? (
          // Play button overlay
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-black/50 to-black/50"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/20 cursor-pointer backdrop-blur-sm">
              <Play fill="white" className="h-8 w-8 text-white ml-1" />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={fixture.teams.home.logo} alt={fixture.teams.home.name} className="w-6 h-6" />
                  <span className="text-white text-sm font-medium">{fixture.teams.home.name}</span>
                  <span className="text-white font-bold mx-1">{fixture.goals.home}</span>
                  <span className="text-white mx-1">-</span>
                  <span className="text-white font-bold mx-1">{fixture.goals.away}</span>
                  <span className="text-white text-sm font-medium">{fixture.teams.away.name}</span>
                  <img src={fixture.teams.away.logo} alt={fixture.teams.away.name} className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-xs font-medium bg-red-500 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Video player (simulated)
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="mb-4 flex justify-center">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                <span className="text-sm">Live broadcast is playing</span>
              </div>
              <div className="flex justify-center items-center space-x-6">
                <div className="text-center">
                  <img src={fixture.teams.home.logo} alt={fixture.teams.home.name} className="w-12 h-12 mx-auto mb-2" />
                  <span className="text-white font-bold text-xl">{fixture.goals.home}</span>
                </div>
                <div className="text-xl font-bold">vs</div>
                <div className="text-center">
                  <img src={fixture.teams.away.logo} alt={fixture.teams.away.name} className="w-12 h-12 mx-auto mb-2" />
                  <span className="text-white font-bold text-xl">{fixture.goals.away}</span>
                </div>
              </div>
            </div>
            
            {/* Player controls */}
            <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black to-transparent flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 rounded-full text-white"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="text-xs text-white">
                  {fixture.fixture.status.elapsed ?? 0}'
                </div>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 rounded-full text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar with team colors */}
      <div className="w-full h-1 flex">
        <div 
          className="h-full" 
          style={{ 
            width: '50%', 
            backgroundColor: homeTeamColor 
          }} 
        />
        <div 
          className="h-full" 
          style={{ 
            width: '50%', 
            backgroundColor: awayTeamColor 
          }} 
        />
      </div>
    </div>
  );
};

export default LiveMatchPlayer;