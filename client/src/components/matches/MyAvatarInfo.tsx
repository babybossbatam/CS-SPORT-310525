import React, { useState, useEffect, useRef, useMemo } from "react";
import { playerImageCache } from "@/lib/playerImageCache";

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
  size?: "sm" | "md" | "lg";
  className?: string;
  sport?: "football" | "basketball";
  onClick?: (
    playerId?: number,
    teamId?: number,
    playerName?: string,
    playerImage?: string,
  ) => void;
}

const MyAvatarInfo: React.FC<MyAvatarInfoProps> = ({
  playerId,
  playerName,
  matchId,
  teamId,
  size = "md",
  className = "",
  onClick,
}) => {
  const componentId = useMemo(
    () => `avatar-${playerId || "unknown"}-${playerName || "unnamed"}`,
    [playerId, playerName],
  );

  const fallbackImageUrl = "/assets/matchdetaillogo/fallback_player.png";
  const [imageUrl, setImageUrl] = useState<string>(fallbackImageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "w-10 h-10 md:w-10 md:h-10 max-md:w-7 max-md:h-7",
    md: "w-10 h-10 md:w-10 md:h-10 max-md:w-7 max-md:h-7",
    lg: "w-14 h-14 md:w-14 md:h-14 max-md:w-9 max-md:h-9",
    "md-commentary": "w-8 h-8 md:w-8 md:h-8 max-md:w-6 max-md:h-6",
  };

  // Create cache key for this player
  const cacheKey = useMemo(() => {
    const cleanName = playerName?.trim().toLowerCase() || "";
    const cleanId = playerId && playerId > 0 ? playerId : null;
    
    if (cleanId && cleanName) return `${cleanId}-${cleanName.replace(/\s+/g, '-')}`;
    if (cleanId) return `id-${cleanId}`;
    if (cleanName) return `name-${cleanName.replace(/\s+/g, '-')}`;
    return "unknown";
  }, [playerId, playerName]);

  // Simple and fast image loading using the existing cache system
  const loadPlayerImage = async (): Promise<string> => {
    try {
      console.log(`🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`);
      
      // Use the existing sophisticated cache system
      const imageUrl = await playerImageCache.getPlayerImageWithFallback(playerId, playerName, teamId);
      
      console.log(`✅ [MyAvatarInfo-${componentId}] Got image: ${imageUrl}`);
      return imageUrl || fallbackImageUrl;
    } catch (error) {
      console.log(`❌ [MyAvatarInfo-${componentId}] Error loading image: ${error}`);
      return fallbackImageUrl;
    }
  };

  // Optimized image loading with persistent cache
  useEffect(() => {
    // Validate we have meaningful player data
    if ((!playerId || playerId <= 0) && (!playerName || !playerName.trim())) {
      console.log(`⚠️ [MyAvatarInfo-${componentId}] No valid player data, using fallback`);
      setImageUrl(fallbackImageUrl);
      setIsLoading(false);
      setIsVisible(true);
      return;
    }

    let isCancelled = false;

    const loadImageOptimized = async () => {
      // Check the persistent cache first for instant loading
      const cachedImage = playerImageCache.getCachedImage(playerId, playerName);
      if (cachedImage && cachedImage.verified) {
        console.log(`⚡ [MyAvatarInfo-${componentId}] Instant cache hit: ${cachedImage.url}`);
        setImageUrl(cachedImage.url);
        setIsLoading(false);
        setIsVisible(true);
        return;
      }

      // Show fallback immediately, then try to load real image in background
      setImageUrl(fallbackImageUrl);
      setIsLoading(false);
      setIsVisible(true);

      // Skip loading if we have recent failures to avoid repeated requests
      if (cachedImage && cachedImage.failureCount && cachedImage.failureCount >= 3) {
        const hoursSinceLastTry = (Date.now() - cachedImage.timestamp) / (1000 * 60 * 60);
        if (hoursSinceLastTry < 24) {
          console.log(`⏭️ [MyAvatarInfo-${componentId}] Skipping ${playerName} - too many recent failures`);
          return;
        }
      }

      try {
        const url = await loadPlayerImage();
        if (!isCancelled && url !== fallbackImageUrl) {
          setImageUrl(url);
        }
      } catch (error) {
        console.log(`❌ [MyAvatarInfo-${componentId}] Failed to load: ${error}`);
        // Fallback is already set, so no need to update
      }
    };

    loadImageOptimized();

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, playerId, playerName]);

  // Optional: Keep intersection observer for performance on large lists (commented out for immediate loading)
  /*
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
      { rootMargin: "100px", threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  */

  const handleClick = () => {
    if (onClick) {
      const actualImageUrl = imageUrl !== fallbackImageUrl ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // No loading state since we show fallback immediately

  return (
    <div
      ref={containerRef}
      key={componentId}
      className={`${sizeClasses[size]} border-2 md:border-2 max-md:border-1 border-gray-300 rounded-full overflow-hidden relative ${onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""} ${className}`}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt={playerName || "Player"}
        className="w-full h-full object-cover"
        onError={() => {
          console.log(
            `🖼️ [MyAvatarInfo-${componentId}] Image error for URL: ${imageUrl}, using fallback`,
          );
          // Only set fallback if current URL is not already the fallback
          if (imageUrl !== fallbackImageUrl) {
            // Mark as failed in the cache system to avoid future attempts
            playerImageCache.setCachedImage(playerId, playerName, imageUrl, 'api', true);
            setImageUrl(fallbackImageUrl);
          }
        }}
        onLoad={() => {
          console.log(
            `✅ [MyAvatarInfo-${componentId}] Image loaded: ${imageUrl}`,
          );
        }}
      />
    </div>
  );
};

export default MyAvatarInfo;
