import React, { useState, useEffect, useRef, useMemo } from "react";
import { getPlayerImage } from "@/lib/playerImageCache";

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

// Simple in-memory cache to prevent duplicate requests
const imageCache = new Map<string, string>();
const loadingRequests = new Map<string, Promise<string>>();

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

  const [imageUrl, setImageUrl] = useState<string>("/assets/matchdetaillogo/fallback_player.png");
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
    if (playerId && playerName) return `${playerId}-${playerName}`;
    if (playerId) return `id-${playerId}`;
    if (playerName) return `name-${playerName}`;
    return "unknown";
  }, [playerId, playerName]);

  // Fast image loading with immediate fallback
  const loadPlayerImage = async (): Promise<string> => {
    // Check cache first for instant return
    if (imageCache.has(cacheKey)) {
      const cachedUrl = imageCache.get(cacheKey)!;
      return cachedUrl;
    }

    // Check if request is already in progress
    if (loadingRequests.has(cacheKey)) {
      return await loadingRequests.get(cacheKey)!;
    }

    // Create new request with fast fallback
    const loadPromise = (async (): Promise<string> => {
      try {
        // Only try the fastest method first (name-based API)
        if (playerName) {
          const nameSearchUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500); // Faster timeout
          
          try {
            const response = await fetch(nameSearchUrl, {
              method: "HEAD",
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok && response.url && !response.url.includes("ui-avatars.com")) {
              imageCache.set(cacheKey, response.url);
              return response.url;
            }
          } catch (error) {
            clearTimeout(timeoutId);
            // Fail fast, don't try more methods
          }
        }

        // Cache fallback to prevent future attempts
        const fallbackUrl = "/assets/matchdetaillogo/fallback_player.png";
        imageCache.set(cacheKey, fallbackUrl);
        return fallbackUrl;
      } catch (error) {
        const fallbackUrl = "/assets/matchdetaillogo/fallback_player.png";
        imageCache.set(cacheKey, fallbackUrl);
        return fallbackUrl;
      } finally {
        loadingRequests.delete(cacheKey);
      }
    })();

    loadingRequests.set(cacheKey, loadPromise);
    return await loadPromise;
  };

  // Immediate loading - no intersection observer delay
  useEffect(() => {
    setIsVisible(true); // Always visible for immediate loading
  }, []);

  // Load image immediately with instant fallback
  useEffect(() => {
    if (!playerId && !playerName) return;

    let isCancelled = false;

    const loadImageInstantly = async () => {
      // Show fallback immediately while loading real image
      setImageUrl("/assets/matchdetaillogo/fallback_player.png");
      setIsLoading(false); // Don't show loading state

      try {
        // Check cache first for instant display
        if (imageCache.has(cacheKey)) {
          const cachedUrl = imageCache.get(cacheKey)!;
          if (!isCancelled) {
            setImageUrl(cachedUrl);
          }
          return;
        }

        // Load real image in background
        const url = await loadPlayerImage();
        if (!isCancelled && url !== "/assets/matchdetaillogo/fallback_player.png") {
          setImageUrl(url);
        }
      } catch (error) {
        // Keep fallback on error
        console.log(`⚠️ [MyAvatarInfo-${componentId}] Background load failed: ${error}`);
      }
    };

    loadImageInstantly();

    return () => {
      isCancelled = true;
    };
  }, [cacheKey]);

  const handleClick = () => {
    if (onClick) {
      const actualImageUrl =
        imageUrl !== "/assets/matchdetaillogo/fallback_player.png" ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // No loading state - show image immediately

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
            `🖼️ [MyAvatarInfo-${componentId}] Image error, using fallback`,
          );
          // Remove from cache and use fallback
          imageCache.set(cacheKey, "/assets/matchdetaillogo/fallback_player.png");
          setImageUrl("/assets/matchdetaillogo/fallback_player.png");
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
