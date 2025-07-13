
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
  // Create a unique component ID to prevent duplicate rendering issues
  const componentId = React.useMemo(() => 
    `avatar-${playerId || 'unknown'}-${playerName || 'unnamed'}-${Date.now()}`, 
    [playerId, playerName]
  );
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('/assets/matchdetaillogo/fallback_player.png');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const fetchPlayerData = async (playerIdToFetch: number, isMounted = true) => {
    if (!isMounted) return;
    
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 [MyAvatarInfo] Fetching player data for ID: ${playerIdToFetch}`);

      // Try multiple image sources directly instead of relying on API
      const imageUrls = [
        `https://media.api-sports.io/football/players/${playerIdToFetch}.png`,
        `https://cdn.resfu.com/img_data/players/medium/${playerIdToFetch}.jpg?size=120x&lossy=1`,
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerIdToFetch}`
      ];

      // Try to load images in order
      for (const url of imageUrls) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const imageLoaded = await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
          });

          if (imageLoaded && isMounted) {
            console.log(`✅ [MyAvatarInfo] Successfully loaded image for player ${playerIdToFetch}: ${url}`);
            setImageUrl(url);
            setPlayerData({ id: playerIdToFetch, name: playerName || 'Player', photo: url });
            return;
          }
        } catch (err) {
          console.log(`⚠️ [MyAvatarInfo] Failed to load image: ${url}`);
          continue;
        }
      }

      // If all direct images fail, try the API as fallback
      try {
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

        if (response.ok) {
          const data = await response.json();
          if (data.player && data.player.photo && isMounted) {
            setImageUrl(data.player.photo);
            setPlayerData(data.player);
            return;
          }
        }
      } catch (apiError) {
        console.log(`⚠️ [MyAvatarInfo] API fallback failed:`, apiError);
      }

      // Final fallback - no error, just use initials
      if (isMounted) {
        console.log(`📝 [MyAvatarInfo] Using initials for player ${playerIdToFetch} (${playerName})`);
        setImageUrl('/assets/matchdetaillogo/fallback_player.png');
      }
    } catch (error) {
      console.error(`❌ [MyAvatarInfo-${componentId}] Error fetching player data:`, error);
      if (isMounted) {
        // Don't set error for image loading issues, just use fallback
        setImageUrl('/assets/matchdetaillogo/fallback_player.png');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const fetchPlayerFromMatch = async (matchIdToFetch: string | number, isMounted = true) => {
    if (!isMounted) return;
    
    try {
      console.log(`🔍 [MyAvatarInfo-${componentId}] Fetching players from match: ${matchIdToFetch}`);
      
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
            
            if (foundPlayer?.player?.id && isMounted) {
              await fetchPlayerData(foundPlayer.player.id, isMounted);
              return;
            }
          }
        }
      }
      
      // Fallback: use provided playerId or show fallback image
      if (playerId && isMounted) {
        await fetchPlayerData(playerId, isMounted);
      } else if (isMounted) {
        setImageUrl('/assets/matchdetaillogo/fallback_player.png');
      }
    } catch (error) {
      console.error(`❌ [MyAvatarInfo-${componentId}] Error fetching match lineups:`, error);
      if (isMounted) {
        setError('Failed to load player from match');
        setImageUrl('/assets/matchdetaillogo/fallback_player.png');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPlayerData = async () => {
      if (!isMounted) return;

      if (playerId) {
        await fetchPlayerData(playerId, isMounted);
      } else if (matchId && playerName) {
        await fetchPlayerFromMatch(matchId, isMounted);
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
    console.log(`⚠️ [MyAvatarInfo] Image failed to load, using initials fallback`);
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
    <div 
      key={componentId}
      className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full overflow-hidden relative ${className}`}
    >
      <img
        src={imageUrl}
        alt={playerName || 'Player'}
        className="w-full h-full object-cover"
        onError={handleImageError}
        style={{ display: imageUrl === '/assets/matchdetaillogo/fallback_player.png' ? 'none' : 'block' }}
      />
      {imageUrl === '/assets/matchdetaillogo/fallback_player.png' && (
        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {generateInitials(playerName)}
        </div>
      )}
      
      
    </div>
  );
};

export default MyAvatarInfo;
