
import React, { useState, useEffect, useRef } from 'react';
import { playerImageCache } from '@/lib/playerImageCache';

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
  sport?: 'football' | 'basketball';
  onClick?: (playerId?: number, teamId?: number, playerName?: string, playerImage?: string) => void;
}

const MyAvatarInfo: React.FC<MyAvatarInfoProps> = ({
  playerId,
  playerName,
  matchId,
  teamId,
  size = 'md',
  className = '',

  onClick
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
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Centralized fallback image path
  const FALLBACK_PLAYER_IMAGE = '/assets/matchdetaillogo/fallback_player.png';

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    'md-commentary': 'w-8 h-8'  // 2px smaller than md for commentary
  };

  const fetchPlayerData = async (playerIdToFetch: number, isMounted = true) => {
    if (!isMounted) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 [MyAvatarInfo-${componentId}] Starting fetchPlayerData for ID: ${playerIdToFetch}, name: ${playerName}, teamId: ${teamId}`);

      // Use the enhanced player image cache system
      const cachedImageUrl = await playerImageCache.getPlayerImageWithFallback(
        playerIdToFetch, 
        playerName, 
        teamId
      );

      console.log(`🔄 [MyAvatarInfo-${componentId}] Cache returned URL: ${cachedImageUrl}`);

      if (cachedImageUrl && isMounted) {
        console.log(`✅ [MyAvatarInfo-${componentId}] Got player image from cache: ${cachedImageUrl}`);
        
        // Check if it's an initials fallback
        if (cachedImageUrl.includes('ui-avatars.com')) {
          console.log(`🎨 [MyAvatarInfo-${componentId}] Using UI avatars fallback`);
          setImageUrl('INITIALS_FALLBACK');
        } else {
          console.log(`📸 [MyAvatarInfo-${componentId}] Setting real image URL: ${cachedImageUrl}`);
          setImageUrl(cachedImageUrl);
          setPlayerData({ 
            id: playerIdToFetch, 
            name: playerName || 'Player', 
            photo: cachedImageUrl 
          });
        }
        return;
      }

      // Final fallback - no error, just use initials
      if (isMounted) {
        console.log(`📝 [MyAvatarInfo-${componentId}] No cached URL available, using initials for player ${playerIdToFetch} (${playerName})`);
        setImageUrl('INITIALS_FALLBACK');
      }
    } catch (error) {
      console.error(`❌ [MyAvatarInfo-${componentId}] Error fetching player data:`, error);
      console.error(`❌ [MyAvatarInfo-${componentId}] Error details:`, {
        playerId: playerIdToFetch,
        playerName,
        teamId,
        errorMessage: error.message,
        errorStack: error.stack
      });
      if (isMounted) {
        // Don't set error for image loading issues, just use fallback
        console.log(`🔄 [MyAvatarInfo-${componentId}] Setting fallback due to error`);
        setImageUrl('INITIALS_FALLBACK');
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
      console.log(`🔍 [MyAvatarInfo-${componentId}] Fetching ${sport} players from match: ${matchIdToFetch}`);

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
        setImageUrl('INITIALS_FALLBACK');
      }
    } catch (error) {
      console.error(`❌ [MyAvatarInfo-${componentId}] Error fetching match lineups:`, error);
      if (isMounted) {
        setError('Failed to load player from match');
        setImageUrl('INITIALS_FALLBACK');
      }
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Data loading effect - only when component becomes visible
  useEffect(() => {
    console.log(`🎯 [MyAvatarInfo-${componentId}] Data loading effect triggered`, {
      shouldLoad,
      playerId,
      matchId,
      playerName,
      teamId
    });

    if (!shouldLoad) {
      console.log(`⏸️ [MyAvatarInfo-${componentId}] Should not load yet, returning`);
      return;
    }

    let isMounted = true;

    const loadPlayerData = async () => {
      if (!isMounted) {
        console.log(`🚫 [MyAvatarInfo-${componentId}] Component unmounted, aborting load`);
        return;
      }

      console.log(`🚀 [MyAvatarInfo-${componentId}] Starting loadPlayerData`);

      if (playerId) {
        console.log(`👤 [MyAvatarInfo-${componentId}] Loading by player ID: ${playerId}`);
        await fetchPlayerData(playerId, isMounted);
      } else if (matchId && playerName) {
        console.log(`⚽ [MyAvatarInfo-${componentId}] Loading by match ID: ${matchId} and player name: ${playerName}`);
        await fetchPlayerFromMatch(matchId, isMounted);
      } else {
        console.log(`🎨 [MyAvatarInfo-${componentId}] No player ID or match info, using initials fallback`);
        if (isMounted) {
          setImageUrl('INITIALS_FALLBACK');
        }
      }
    };

    loadPlayerData();

    return () => {
      console.log(`🧹 [MyAvatarInfo-${componentId}] Cleanup: setting isMounted to false`);
      isMounted = false;
    };
  }, [shouldLoad, playerId, matchId, playerName]);

  const handleImageError = () => {
    console.log(`⚠️ [MyAvatarInfo-${componentId}] Image error occurred!`);
    console.log(`⚠️ [MyAvatarInfo-${componentId}] Current imageUrl: ${imageUrl}`);
    console.log(`⚠️ [MyAvatarInfo-${componentId}] Player details:`, {
      playerId,
      playerName,
      teamId,
      fallbackImage: FALLBACK_PLAYER_IMAGE
    });
    
    if (imageUrl === FALLBACK_PLAYER_IMAGE) {
      console.log(`⚠️ [MyAvatarInfo-${componentId}] Fallback image also failed, using initials`);
      setImageUrl('INITIALS_FALLBACK');
    } else {
      console.log(`⚠️ [MyAvatarInfo-${componentId}] Primary image failed, trying fallback image: ${FALLBACK_PLAYER_IMAGE}`);
      setImageUrl(FALLBACK_PLAYER_IMAGE);
    }
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

  // Enhanced loading state with lazy loading
  if (!isVisible || isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
       
      >
       
      </div>
    );
  }

  const handleClick = () => {
    if (onClick) {
      // Pass the actual image URL that's being displayed
      const actualImageUrl = imageUrl !== FALLBACK_PLAYER_IMAGE && imageUrl !== 'INITIALS_FALLBACK' ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  return (
    <div 
      ref={containerRef}
      key={componentId}
      className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full overflow-hidden relative ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
      onClick={handleClick}
    >
      {imageUrl === 'INITIALS_FALLBACK' ? (
        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {generateInitials(playerName)}
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={playerName || `${sport === 'basketball' ? 'Basketball' : 'Football'} Player`}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log(`🖼️ [MyAvatarInfo-${componentId}] IMG onError triggered!`);
            console.log(`🖼️ [MyAvatarInfo-${componentId}] Failed image src: ${imageUrl}`);
            console.log(`🖼️ [MyAvatarInfo-${componentId}] Image element:`, e.target);
            handleImageError();
          }}
          onLoad={() => {
            console.log(`✅ [MyAvatarInfo-${componentId}] IMG onLoad success for: ${imageUrl}`);
          }}
        />
      )}
    </div>
  );
};

export default MyAvatarInfo;
