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

  // Use the enhanced player photo system
  const loadPlayerImage = async () => {
    if (!playerId && !playerName) {
      setImageUrl('INITIALS_FALLBACK');
      return;
    }

    setIsLoading(true);
    console.log(`🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`);

    try {
      // Try the enhanced name-based search first if we have a player name
      if (playerName) {
        try {
          const nameSearchUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`;
          const response = await fetch(nameSearchUrl, { method: 'HEAD' });
          
          if (response.ok && response.url && !response.url.includes('ui-avatars.com')) {
            console.log(`✅ [MyAvatarInfo-${componentId}] Found photo via name search: ${response.url}`);
            setImageUrl(response.url);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log(`⚠️ [MyAvatarInfo-${componentId}] Name search failed: ${error}`);
        }
      }

      // Try ID-based search as backup
      if (playerId) {
        try {
          const idSearchUrl = `/api/player-photo/${playerId}`;
          const response = await fetch(idSearchUrl, { method: 'HEAD' });
          
          if (response.ok && response.url) {
            console.log(`✅ [MyAvatarInfo-${componentId}] Found photo via ID search: ${response.url}`);
            setImageUrl(response.url);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log(`⚠️ [MyAvatarInfo-${componentId}] ID search failed: ${error}`);
        }
      }

      // Try cached system as final backup
      try {
        const cachedImageUrl = await getPlayerImage(playerId, playerName, teamId);
        
        if (cachedImageUrl && cachedImageUrl !== '' && cachedImageUrl !== 'INITIALS_FALLBACK') {
          console.log(`✅ [MyAvatarInfo-${componentId}] Got cached image: ${cachedImageUrl}`);
          
          // Test if the image actually loads before setting it
          const img = new Image();
          img.onload = () => {
            console.log(`🖼️ [MyAvatarInfo-${componentId}] Image verified: ${cachedImageUrl}`);
            setImageUrl(cachedImageUrl);
            setIsLoading(false);
          };
          img.onerror = () => {
            console.log(`❌ [MyAvatarInfo-${componentId}] Image failed to load: ${cachedImageUrl}`);
            setImageUrl('INITIALS_FALLBACK');
            setIsLoading(false);
          };
          img.src = cachedImageUrl;
          return;
        }
      } catch (error) {
        console.log(`❌ [MyAvatarInfo-${componentId}] Cached image error: ${error?.message || error}`);
      }

      // All methods failed, use fallback
      console.log(`🎨 [MyAvatarInfo-${componentId}] All methods failed, using fallback for: ${playerName}`);
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