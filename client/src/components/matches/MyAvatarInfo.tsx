import React, { useState, useEffect, useRef } from 'react';
import { getPlayerImage, playerImageCache } from '@/lib/playerImageCache';

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

  // Optimized player photo loading with parallel requests and faster fallbacks
  const loadPlayerImage = async () => {
    if (!playerId && !playerName) {
      setImageUrl('INITIALS_FALLBACK');
      return;
    }

    setIsLoading(true);
    console.log(`🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`);

    try {
      // Check cache first for instant loading
      const cached = await getPlayerImage(playerId, playerName, teamId);
      if (cached && cached !== '' && cached !== 'INITIALS_FALLBACK' && !cached.includes('ui-avatars.com')) {
        console.log(`💾 [MyAvatarInfo-${componentId}] Using cached image: ${cached}`);
        setImageUrl(cached);
        setIsLoading(false);
        return;
      }

      // Prepare parallel requests with timeout
      const timeoutMs = 3000; // 3 second timeout
      const requests = [];

      // Add name-based search if available
      if (playerName) {
        requests.push({
          type: 'name',
          promise: fetch(`/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`, {
            signal: AbortSignal.timeout(timeoutMs)
          }).then(res => ({ type: 'name', response: res, url: res.url }))
        });
      }

      // Add ID-based search if available
      if (playerId) {
        requests.push({
          type: 'id',
          promise: fetch(`/api/player-photo/${playerId}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(timeoutMs)
          }).then(res => ({ type: 'id', response: res, url: res.url }))
        });

        // Add direct API-Sports URL as fallback
        const apiSportsUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
        requests.push({
          type: 'direct',
          promise: new Promise((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => resolve({ type: 'direct', response: null, url: null }), 2000);
            img.onload = () => {
              clearTimeout(timeout);
              resolve({ type: 'direct', response: { ok: true }, url: apiSportsUrl });
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve({ type: 'direct', response: null, url: null });
            };
            img.src = apiSportsUrl;
          })
        });
      }

      if (requests.length === 0) {
        setImageUrl('INITIALS_FALLBACK');
        setIsLoading(false);
        return;
      }

      // Execute all requests in parallel and use the first successful one
      const results = await Promise.allSettled(requests.map(r => r.promise));
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.response?.ok && result.value.url) {
          const url = result.value.url;
          
          // Skip ui-avatars and placeholder URLs for better quality
          if (!url.includes('ui-avatars.com') && 
              !url.includes('default.png') && 
              !url.includes('placeholder')) {
            
            console.log(`✅ [MyAvatarInfo-${componentId}] Found photo via ${result.value.type}: ${url}`);
            setImageUrl(url);
            setIsLoading(false);
            return;
          }
        }
      }

      // If all requests failed, use fallback
      console.log(`🎨 [MyAvatarInfo-${componentId}] All requests failed, using fallback for: ${playerName}`);
      setImageUrl('INITIALS_FALLBACK');
      setIsLoading(false);

    } catch (error) {
      console.log(`❌ [MyAvatarInfo-${componentId}] Error loading image: ${error?.message || error}`);
      setImageUrl('INITIALS_FALLBACK');
      setIsLoading(false);
    }
  };

  // Optimized Intersection Observer for faster lazy loading
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
      { 
        rootMargin: '100px', // Increased margin for earlier loading
        threshold: 0.01 // Lower threshold for faster trigger
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load image when visible with immediate cache check
  useEffect(() => {
    if (isVisible) {
      // Try immediate synchronous cache check first
      const cached = playerImageCache?.getCachedImage(playerId, playerName);
      if (cached && cached.url && cached.url !== 'INITIALS_FALLBACK' && !cached.url.includes('ui-avatars.com')) {
        console.log(`⚡ [MyAvatarInfo-${componentId}] Instant cache hit: ${cached.url}`);
        setImageUrl(cached.url);
        setIsLoading(false);
      } else {
        loadPlayerImage();
      }
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