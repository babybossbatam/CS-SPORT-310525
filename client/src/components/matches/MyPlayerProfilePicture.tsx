
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MyPlayerProfilePictureProps {
  playerId?: number;
  playerName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  teamType?: 'home' | 'away';
}

const MyPlayerProfilePicture: React.FC<MyPlayerProfilePictureProps> = ({
  playerId,
  playerName = 'Unknown Player',
  size = 'md',
  className = '',
  showBorder = true,
  teamType
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  // Generate player image URLs with multiple CDN sources including 365scores
  const getPlayerImageUrls = (id: number): string[] => {
    return [
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v10/Athletes/${id}`,
      `https://imagecache.365scores.com/image/upload/f_png,w_35,h_35,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v10/Athletes/${id}`,
      `https://cdn.resfu.com/img_data/players/medium/${id}.jpg?size=120x&lossy=1`,
      `https://cdn.resfu.com/img_data/players/medium/${id}.jpg`,
      `https://cdn.resfu.com/img_data/players/small/${id}.jpg?size=120x&lossy=1`,
      `https://media.api-sports.io/football/players/${id}.png`,
    ];
  };

  // Generate initials fallback
  const generateInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'P';
  };

  // Generate fallback avatar URL
  const getFallbackAvatarUrl = (name: string): string => {
    const initials = generateInitials(name);
    const bgColor = teamType === 'home' ? '4F46E5' : teamType === 'away' ? 'EF4444' : '6B7280';
    return `https://ui-avatars.com/api/?name=${initials}&size=128&background=${bgColor}&color=fff&bold=true&format=svg`;
  };

  useEffect(() => {
    const loadPlayerImage = async () => {
      setIsLoading(true);
      setHasError(false);

      // If we have a player ID, try multiple CDN sources
      if (playerId) {
        try {
          const imageUrls = getPlayerImageUrls(playerId);
          let urlIndex = 0;

          const tryNextUrl = () => {
            if (urlIndex >= imageUrls.length) {
              console.warn(`⚠️ [MyPlayerProfilePicture] All CDN sources failed for player ${playerId} (${playerName}), using fallback`);
              setImageUrl(getFallbackAvatarUrl(playerName));
              setHasError(true);
              setIsLoading(false);
              return;
            }

            const currentUrl = imageUrls[urlIndex];
            const img = new Image();
            
            img.onload = () => {
              setImageUrl(currentUrl);
              setIsLoading(false);
              console.log(`✅ [MyPlayerProfilePicture] Successfully loaded image for player ${playerId} (${playerName}) from source ${urlIndex + 1}`);
            };
            
            img.onerror = () => {
              console.log(`⚠️ [MyPlayerProfilePicture] Source ${urlIndex + 1} failed for player ${playerId}, trying next...`);
              urlIndex++;
              tryNextUrl();
            };
            
            img.src = currentUrl;
          };

          tryNextUrl();
        } catch (error) {
          console.error(`❌ [MyPlayerProfilePicture] Error loading image for player ${playerId}:`, error);
          setImageUrl(getFallbackAvatarUrl(playerName));
          setHasError(true);
          setIsLoading(false);
        }
      } else {
        // No player ID, use fallback immediately
        setImageUrl(getFallbackAvatarUrl(playerName));
        setIsLoading(false);
      }
    };

    loadPlayerImage();
  }, [playerId, playerName, teamType]);

  const handleImageError = () => {
    if (!hasError) {
      console.warn(`⚠️ [MyPlayerProfilePicture] Image error for player ${playerId} (${playerName}), switching to fallback`);
      setImageUrl(getFallbackAvatarUrl(playerName));
      setHasError(true);
    }
  };

  const borderClass = showBorder ? `border-2 ${teamType === 'home' ? 'border-blue-500' : teamType === 'away' ? 'border-red-500' : 'border-gray-300'}` : '';
  const teamBgClass = teamType === 'home' ? 'player-image-home-team' : teamType === 'away' ? 'player-image-away-team' : '';

  return (
    <div className={`player-image-container ${className}`}>
      <Avatar className={`${sizeClasses[size]} ${borderClass} ${teamBgClass} shadow-sm transition-all duration-200 hover:scale-105`}>
        {isLoading ? (
          <div className={`${sizeClasses[size]} bg-gray-200 animate-pulse rounded-full flex items-center justify-center`}>
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
          </div>
        ) : (
          <>
            <AvatarImage
              src={imageUrl}
              alt={`${playerName} profile picture`}
              className="object-cover"
              onError={handleImageError}
            />
            <AvatarFallback className={`bg-gray-500 text-white ${textSizes[size]} font-bold flex items-center justify-center`}>
              {generateInitials(playerName)}
            </AvatarFallback>
          </>
        )}
      </Avatar>
      
      {/* Cache indicator for debugging */}
      {process.env.NODE_ENV === 'development' && !hasError && !isLoading && (
        <div className="player-image-cache-indicator" title="Image loaded successfully"></div>
      )}
    </div>
  );
};

export default MyPlayerProfilePicture;

// Export utility functions for external use
export const getPlayerImageUrl = (playerId: number): string => {
  return `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`;
};

export const generatePlayerInitials = (playerName: string): string => {
  return playerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P';
};
