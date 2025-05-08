import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Zap } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface MatchAtmosphericSoundsProps {
  matchIntensity?: 'low' | 'medium' | 'high'; // Optional intensity to auto-select appropriate sounds
  homeTeamId?: number; // Optional team ID for team specific chants
  awayTeamId?: number; // Optional team ID for team specific chants
}

// Define different sound types
const SOUND_TYPES = {
  CROWD_AMBIENT: 'crowd_ambient',
  CROWD_CHEER: 'crowd_cheer',
  CROWD_ROAR: 'crowd_roar',
  WHISTLE: 'whistle',
  GOAL: 'goal'
};

// Map of sound URLs (these would be replaced by actual sound file paths)
const SOUND_URLS = {
  [SOUND_TYPES.CROWD_AMBIENT]: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  [SOUND_TYPES.CROWD_CHEER]: 'https://assets.mixkit.co/active_storage/sfx/943/943-preview.mp3',
  [SOUND_TYPES.CROWD_ROAR]: 'https://assets.mixkit.co/active_storage/sfx/1198/1198-preview.mp3',
  [SOUND_TYPES.WHISTLE]: 'https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3',
  [SOUND_TYPES.GOAL]: 'https://assets.mixkit.co/active_storage/sfx/2067/2067-preview.mp3'
};

// Atmosphere presets
const ATMOSPHERE_PRESETS = {
  'Pre-match': [SOUND_TYPES.CROWD_AMBIENT],
  'Kickoff': [SOUND_TYPES.WHISTLE, SOUND_TYPES.CROWD_AMBIENT],
  'Goal!': [SOUND_TYPES.GOAL, SOUND_TYPES.CROWD_ROAR],
  'Intense Moment': [SOUND_TYPES.CROWD_CHEER],
  'Full Time': [SOUND_TYPES.WHISTLE, SOUND_TYPES.CROWD_ROAR]
};

const MatchAtmosphericSounds: React.FC<MatchAtmosphericSoundsProps> = ({
  matchIntensity = 'medium',
  homeTeamId,
  awayTeamId
}) => {
  // State for the main controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [activeSounds, setActiveSounds] = useState<string[]>([SOUND_TYPES.CROWD_AMBIENT]);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  
  // Refs for audio elements
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  
  // Initialize audio elements
  useEffect(() => {
    // Create audio elements for each sound type
    Object.entries(SOUND_URLS).forEach(([soundType, url]) => {
      const audio = new Audio(url);
      audio.loop = soundType === SOUND_TYPES.CROWD_AMBIENT; // Only ambient loops
      audio.volume = volume / 100;
      audioRefs.current[soundType] = audio;
    });
    
    // Cleanup on unmount
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);
  
  // Update volume when it changes
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.volume = volume / 100;
      }
    });
  }, [volume]);
  
  // Update playing state
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([soundType, audio]) => {
      if (audio) {
        if (isPlaying && activeSounds.includes(soundType)) {
          audio.play().catch(error => {
            console.error('Error playing audio:', error);
            // Auto-mute if browser prevents autoplay
            setVolume(0);
          });
        } else {
          audio.pause();
        }
      }
    });
  }, [isPlaying, activeSounds]);
  
  // Handle toggling sound
  const toggleSound = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle preset selection
  const selectPreset = (presetName: string) => {
    const sounds = ATMOSPHERE_PRESETS[presetName as keyof typeof ATMOSPHERE_PRESETS] || [];
    setActiveSounds(sounds);
    setCurrentPreset(presetName);
    
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };
  
  // Get intensity class based on match intensity
  const getIntensityClass = () => {
    switch (matchIntensity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-3 w-60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Music className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Match Atmosphere</span>
          </div>
          <div className={`flex items-center ${getIntensityClass()}`}>
            <Zap className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium capitalize">{matchIntensity}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Volume control */}
          <div className="flex items-center space-x-2">
            {volume === 0 ? (
              <VolumeX className="h-4 w-4 text-gray-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-gray-500" />
            )}
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-8 text-right">{volume}%</span>
          </div>
          
          {/* Presets dropdown */}
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                  {currentPreset || 'Select atmosphere'}
                  <span className="ml-1">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.keys(ATMOSPHERE_PRESETS).map((preset) => (
                  <DropdownMenuItem key={preset} onClick={() => selectPreset(preset)}>
                    {preset}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Play/Pause button */}
          <Button 
            size="sm" 
            className={`w-full ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={toggleSound}
          >
            {isPlaying ? 'Stop Sounds' : 'Play Atmosphere'}
          </Button>
        </div>
        
        {/* Sound indicators */}
        {isPlaying && (
          <div className="mt-3 flex flex-wrap gap-1">
            {activeSounds.map(sound => (
              <div 
                key={sound} 
                className="px-2 py-1 bg-gray-100 rounded-full text-xs animate-pulse"
                title={sound.replace('_', ' ')}
              >
                {sound.split('_')[0]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchAtmosphericSounds;