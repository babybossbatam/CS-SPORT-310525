
import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Simple in-memory cache to prevent duplicate requests
const imageCache = new Map<string, string>();
const loadingRequests = new Map<string, Promise<string>>();

const MyAvatarInfo: React.FC<MyAvatarInfoProps> = ({
  playerId,
  playerName,
  matchId,
  teamId,
  size = 'md',
  className = '',
  onClick
}) => {
  const componentId = useMemo(() => 
    `avatar-${playerId || 'unknown'}-${playerName || 'unnamed'}`, 
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

  // Create cache key for this player
  const cacheKey = useMemo(() => {
    if (playerId && playerName) return `${playerId}-${playerName}`;
    if (playerId) return `id-${playerId}`;
    if (playerName) return `name-${playerName}`;
    return 'unknown';
  }, [playerId, playerName]);

  // Optimized image loading with caching and deduplication
  const loadPlayerImage = async (): Promise<string> => {
    // Check cache first
    if (imageCache.has(cacheKey)) {
      const cachedUrl = imageCache.get(cacheKey)!;
      console.log(`💾 [MyAvatarInfo-${componentId}] Cache hit: ${cachedUrl}`);
      return cachedUrl;
    }

    // Check if request is already in progress
    if (loadingRequests.has(cacheKey)) {
      console.log(`⏳ [MyAvatarInfo-${componentId}] Request in progress, waiting...`);
      return await loadingRequests.get(cacheKey)!;
    }

    // Create new request
    const loadPromise = (async (): Promise<string> => {
      try {
        console.log(`🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`);

        // Try name-based search first (fastest if available)
        if (playerName) {
          try {
            const nameSearchUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`;
            const response = await fetch(nameSearchUrl, { 
              method: 'HEAD',
              timeout: 3000 // 3 second timeout
            } as any);
            
            if (response.ok && response.url && 
                !response.url.includes('ui-avatars.com') && 
                !response.url.includes('default.png') &&
                !response.url.includes('placeholder')) {
              
              console.log(`✅ [MyAvatarInfo-${componentId}] Found via name search: ${response.url}`);
              imageCache.set(cacheKey, response.url);
              return response.url;
            }
          } catch (error) {
            console.log(`⚠️ [MyAvatarInfo-${componentId}] Name search failed: ${error}`);
          }
        }

        // Try ID-based search as backup
        if (playerId) {
          try {
            const idSearchUrl = `/api/player-photo/${playerId}`;
            const response = await fetch(idSearchUrl, { 
              method: 'HEAD',
              timeout: 3000
            } as any);
            
            if (response.ok && response.url) {
              console.log(`✅ [MyAvatarInfo-${componentId}] Found via ID search: ${response.url}`);
              imageCache.set(cacheKey, response.url);
              return response.url;
            }
          } catch (error) {
            console.log(`⚠️ [MyAvatarInfo-${componentId}] ID search failed: ${error}`);
          }
        }

        // Try cached system as final backup (without image validation)
        try {
          const cachedImageUrl = await getPlayerImage(playerId, playerName, teamId);
          
          if (cachedImageUrl && cachedImageUrl !== '' && cachedImageUrl !== 'INITIALS_FALLBACK') {
            console.log(`✅ [MyAvatarInfo-${componentId}] Got from player cache: ${cachedImageUrl}`);
            imageCache.set(cacheKey, cachedImageUrl);
            return cachedImageUrl;
          }
        } catch (error) {
          console.log(`❌ [MyAvatarInfo-${componentId}] Cache system error: ${(error as Error)?.message || error}`);
        }

        // All methods failed, cache the fallback to prevent future attempts
        console.log(`🎨 [MyAvatarInfo-${componentId}] Using fallback for: ${playerName}`);
        imageCache.set(cacheKey, 'INITIALS_FALLBACK');
        return 'INITIALS_FALLBACK';

      } catch (error) {
        console.log(`❌ [MyAvatarInfo-${componentId}] Error loading image: ${error?.message || error}`);
        imageCache.set(cacheKey, 'INITIALS_FALLBACK');
        return 'INITIALS_FALLBACK';
      } finally {
        // Clean up loading request
        loadingRequests.delete(cacheKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    loadingRequests.set(cacheKey, loadPromise);
    return await loadPromise;
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
      { rootMargin: '100px', threshold: 0.1 } // Increased rootMargin for earlier loading
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load image when visible
  useEffect(() => {
    if (!isVisible || (!playerId && !playerName)) return;

    let isCancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      
      try {
        const url = await loadPlayerImage();
        if (!isCancelled) {
          setImageUrl(url);
        }
      } catch (error) {
        if (!isCancelled) {
          console.log(`❌ [MyAvatarInfo-${componentId}] Failed to load: ${error}`);
          setImageUrl('INITIALS_FALLBACK');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [isVisible, cacheKey]);

  const handleClick = () => {
    if (onClick) {
      const actualImageUrl = imageUrl !== 'INITIALS_FALLBACK' ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // Early return for loading state
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
            console.log(`🖼️ [MyAvatarInfo-${componentId}] Image error, using fallback`);
            // Remove from cache and use fallback
            imageCache.set(cacheKey, 'INITIALS_FALLBACK');
            setImageUrl('INITIALS_FALLBACK');
          }}
          onLoad={() => {
            console.log(`✅ [MyAvatarInfo-${componentId}] Image loaded: ${imageUrl}`);
          }}
        />
      )}
    </div>
  );
};

export default MyAvatarInfo;
