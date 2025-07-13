
import React, { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  photo?: string;
}

interface MyAvatarInfoProps {
  playerId?: number;
  playerName?: string;
  matchId?: string | number;
  teamId?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MyAvatarInfo: React.FC<MyAvatarInfoProps> = ({
  playerId,
  playerName,
  matchId,
  teamId,
  size = 'md',
  className = ''
}) => {
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('/assets/matchdetaillogo/fallback_player.png');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const fetchPlayerData = async (playerIdToFetch: number) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 [MyAvatarInfo] Fetching player data for ID: ${playerIdToFetch}`);

      const response = await fetch('/api/player-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerIdToFetch,
          season: '2025'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.player) {
        setPlayerData(data.player);
        
        // Try multiple image sources
        if (data.player.photo) {
          setImageUrl(data.player.photo);
        } else if (playerIdToFetch) {
          // Fallback to 365scores CDN
          const fallbackUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerIdToFetch}`;
          setImageUrl(fallbackUrl);
        }
      }
    } catch (error) {
      console.error('❌ [MyAvatarInfo] Error fetching player data:', error);
      setError('Failed to load player data');
      setImageUrl('/assets/matchdetaillogo/fallback_player.png');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerFromMatch = async (matchIdToFetch: string | number) => {
    try {
      console.log(`🔍 [MyAvatarInfo] Fetching players from match: ${matchIdToFetch}`);
      
      const response = await fetch(`/api/fixtures/${matchIdToFetch}/lineups`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Try to find player in lineups by name
        if (data.lineups && playerName) {
          for (const lineup of data.lineups) {
            const foundPlayer = lineup.startXI?.find((p: any) => 
              p.player?.name?.toLowerCase().includes(playerName.toLowerCase())
            ) || lineup.substitutes?.find((p: any) => 
              p.player?.name?.toLowerCase().includes(playerName.toLowerCase())
            );
            
            if (foundPlayer?.player?.id) {
              await fetchPlayerData(foundPlayer.player.id);
              return;
            }
          }
        }
      }
      
      // Fallback: use provided playerId or show fallback image
      if (playerId) {
        await fetchPlayerData(playerId);
      } else {
        setImageUrl('/assets/matchdetaillogo/fallback_player.png');
      }
    } catch (error) {
      console.error('❌ [MyAvatarInfo] Error fetching match lineups:', error);
      setImageUrl('/assets/matchdetaillogo/fallback_player.png');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPlayerData = async () => {
      if (!isMounted) return;

      if (playerId) {
        await fetchPlayerData(playerId);
      } else if (matchId && playerName) {
        await fetchPlayerFromMatch(matchId);
      } else {
        if (isMounted) {
          setImageUrl('/assets/matchdetaillogo/fallback_player.png');
        }
      }
    };

    loadPlayerData();

    return () => {
      isMounted = false;
    };
  }, [playerId, matchId, playerName]);

  const handleImageError = () => {
    console.log(`⚠️ [MyAvatarInfo] Image failed to load, using fallback`);
    setImageUrl('/assets/matchdetaillogo/fallback_player.png');
  };

  const generateInitials = (name?: string): string => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full bg-gray-100 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full overflow-hidden relative ${className}`}>
      {imageUrl !== '/assets/matchdetaillogo/fallback_player.png' ? (
        <img
          src={imageUrl}
          alt={playerName || 'Player'}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {generateInitials(playerName)}
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}
    </div>
  );
};

export default MyAvatarInfo;
