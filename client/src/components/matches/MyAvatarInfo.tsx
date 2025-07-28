import React, { useState, useEffect, useRef } from 'react';

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
    sm: 'w-10 h-10',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    'md-commentary': 'w-8 h-8'
  };

  // Simple image sources - only reliable ones
  const getImageSources = (playerId?: number, playerName?: string): string[] => {
    const sources: string[] = [];

    // 1. Our backend name-based search (most reliable)
    if (playerName) {
      sources.push(`/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`);
    }

    // 2. API-Sports direct (if we have ID)
    if (playerId) {
      sources.push(`https://media.api-sports.io/football/players/${playerId}.png`);
    }

    // 3. 365Scores CDN (if we have ID)
    if (playerId) {
      sources.push(`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`);
    }

    return sources;
  };

  // Try loading images one by one
  const loadPlayerImage = async () => {
    if (!playerId && !playerName) {
      setImageUrl('INITIALS_FALLBACK');
      return;
    }

    setIsLoading(true);
    console.log(`🔍 [MyAvatarInfo-${componentId}] Starting simple image load for: ${playerName} (ID: ${playerId})`);

    const sources = getImageSources(playerId, playerName);

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      console.log(`🔄 [MyAvatarInfo-${componentId}] Trying source ${i + 1}/${sources.length}: ${source}`);

      try {
        const isValid = await testImageUrl(source);
        if (isValid) {
          console.log(`✅ [MyAvatarInfo-${componentId}] Success with source ${i + 1}: ${source}`);
          setImageUrl(source);
          setIsLoading(false);
          return;
        } else {
          console.log(`❌ [MyAvatarInfo-${componentId}] Failed source ${i + 1}: ${source}`);
        }
      } catch (error) {
        console.log(`❌ [MyAvatarInfo-${componentId}] Error with source ${i + 1}: ${error.message}`);
      }
    }

    // All sources failed - use initials
    console.log(`🎨 [MyAvatarInfo-${componentId}] All sources failed, using initials for: ${playerName}`);
    setImageUrl('INITIALS_FALLBACK');
    setIsLoading(false);
  };

  // Simple image validation
  const testImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // For our API endpoints, try a simple fetch
      if (url.startsWith('/api/')) {
        fetch(url, { method: 'HEAD' })
          .then(response => resolve(response.ok))
          .catch(() => resolve(false));
        return;
      }

      // For external URLs, use Image object with timeout
      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = img.onerror = null;
        resolve(false);
      }, 3000); // 3 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = url;
    });
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
      className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full overflow-hidden relative ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
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