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
    sm: 'w-10 h-10',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    'md-commentary': 'w-8 h-8'
  };

  // Use the cached player image system
  const loadPlayerImage = async () => {
    if (!playerId && !playerName) {
      setImageUrl('INITIALS_FALLBACK');
      return;
    }

    setIsLoading(true);
    console.log(`🔍 [MyAvatarInfo-${componentId}] Loading cached image for: ${playerName} (ID: ${playerId})`);

    try {
      const cachedImageUrl = await getPlayerImage(playerId, playerName, teamId);
      
      if (cachedImageUrl && cachedImageUrl !== '') {
        console.log(`✅ [MyAvatarInfo-${componentId}] Got cached image: ${cachedImageUrl}`);
        setImageUrl(cachedImageUrl);
      } else {
        console.log(`🎨 [MyAvatarInfo-${componentId}] No cached image found, using fallback for: ${playerName}`);
        setImageUrl('INITIALS_FALLBACK');
      }
    } catch (error) {
      console.log(`❌ [MyAvatarInfo-${componentId}] Error loading cached image: ${error.message}`);
      setImageUrl('INITIALS_FALLBACK');
    } finally {
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