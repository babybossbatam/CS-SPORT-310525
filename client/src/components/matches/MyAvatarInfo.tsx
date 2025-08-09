import React, { useState, useEffect, useRef } from 'react';
import { getPlayerImage } from '@/lib/playerImageCache';

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
  const componentId = React.useMemo(() => 
    `avatar-${playerId || 'unknown'}-${playerName || 'unnamed'}-${Date.now()}`, 
    [playerId, playerName]
  );

  const [imageUrl, setImageUrl] = useState<string>('INITIALS_FALLBACK');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-10 h-10 md:w-10 md:h-10 max-md:w-7 max-md:h-7',
    md: 'w-10 h-10 md:w-10 md:h-10 max-md:w-7 max-md:h-7',
    lg: 'w-14 h-14 md:w-14 md:h-14 max-md:w-9 max-md:h-9',
    'md-commentary': 'w-8 h-8 md:w-8 md:h-8 max-md:w-6 max-md:h-6'
  };

  // Optimized player image loading with improved caching and parallel requests
  const loadPlayerImage = async () => {
    if (!playerId && !playerName) {
      setImageUrl('INITIALS_FALLBACK');
      return;
    }

    setIsLoading(true);
    console.log(`🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`);

    try {
      // First, check enhanced cache system immediately
      const cachedImageUrl = await getPlayerImage(playerId, playerName, teamId);
      if (cachedImageUrl && cachedImageUrl !== 'INITIALS_FALLBACK' && !cachedImageUrl.includes('ui-avatars.com')) {
        console.log(`⚡ [MyAvatarInfo-${componentId}] Cache hit: ${cachedImageUrl}`);
        setImageUrl(cachedImageUrl);
        setIsLoading(false);
        return;
      }

      // Parallel image loading strategy - try multiple sources simultaneously
      const imagePromises = [];

      // Source 1: Name-based search
      if (playerName) {
        const nameSearchPromise = fetch(`/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        }).then(response => {
          if (response.ok && response.url && 
              !response.url.includes('ui-avatars.com') && 
              !response.url.includes('default.png') &&
              !response.url.includes('placeholder')) {
            return { url: response.url, source: 'name-search', priority: 1 };
          }
          return null;
        }).catch(() => null);

        imagePromises.push(nameSearchPromise);
      }

      // Source 2: ID-based search  
      if (playerId) {
        const idSearchPromise = fetch(`/api/player-photo/${playerId}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        }).then(response => {
          if (response.ok && response.url) {
            return { url: response.url, source: 'id-search', priority: 2 };
          }
          return null;
        }).catch(() => null);

        imagePromises.push(idSearchPromise);
      }

      // Source 3: Direct API-Sports URL
      if (playerId) {
        const apiSportsUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
        const apiSportsPromise = new Promise(resolve => {
          const img = new Image();
          const timeout = setTimeout(() => resolve(null), 2000);

          img.onload = () => {
            clearTimeout(timeout);
            resolve({ url: apiSportsUrl, source: 'api-sports', priority: 3 });
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          img.src = apiSportsUrl;
        });

        imagePromises.push(apiSportsPromise);
      }

      // Wait for first successful response
      const results = await Promise.allSettled(imagePromises);
      const validResults = results
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter(result => result !== null)
        .sort((a, b) => a.priority - b.priority); // Sort by priority

      if (validResults.length > 0) {
        const bestResult = validResults[0];
        console.log(`✅ [MyAvatarInfo-${componentId}] Found photo via ${bestResult.source}: ${bestResult.url}`);
        setImageUrl(bestResult.url);
        setIsLoading(false);
        return;
      }

      // All sources failed, use fallback
      console.log(`🎨 [MyAvatarInfo-${componentId}] All sources failed, using fallback`);
      setImageUrl('INITIALS_FALLBACK');
      setIsLoading(false);

    } catch (error) {
      console.log(`❌ [MyAvatarInfo-${componentId}] Error loading image: ${error?.message || error}`);
      setImageUrl('INITIALS_FALLBACK');
      setIsLoading(false);
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
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load image when visible
  useEffect(() => {
    if (isVisible) {
      loadPlayerImage();
    }
  }, [isVisible, playerId, playerName]);

  const generateInitials = (name?: string): string => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleClick = () => {
    if (onClick) {
      const actualImageUrl = imageUrl !== 'INITIALS_FALLBACK' ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // Loading state
  if (!isVisible || isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-pulse ${className}`}
      >
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      key={componentId}
      className={`${sizeClasses[size]} border-2 md:border-2 max-md:border-1 border-gray-300 rounded-full overflow-hidden relative ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
      onClick={handleClick}
    >
      {imageUrl === 'INITIALS_FALLBACK' ? (
        <img
          src="/assets/matchdetaillogo/fallback_player.png"
          alt={playerName || 'Player'}
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={imageUrl}
          alt={playerName || 'Player'}
          className="w-full h-full object-cover"
          onError={() => {
            console.log(`🖼️ [MyAvatarInfo-${componentId}] Image error, falling back to fallback player image`);
            setImageUrl('INITIALS_FALLBACK');
          }}
          onLoad={() => {
            console.log(`✅ [MyAvatarInfo-${componentId}] Image loaded successfully: ${imageUrl}`);
          }}
        />
      )}
    </div>
  );
};

export default MyAvatarInfo;