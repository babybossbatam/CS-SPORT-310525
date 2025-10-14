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
  const [isVisible, setIsVisible] = useState(true);
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
      console.log(
        `⏳ [MyAvatarInfo-${componentId}] Request in progress, waiting...`,
      );
      return await loadingRequests.get(cacheKey)!;
    }

    // Create new request
    const loadPromise = (async (): Promise<string> => {
      try {
        console.log(
          `🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`,
        );

        // Try advanced cache system first (fastest - multiple sources)
        try {
          const cachedImageUrl = await getPlayerImage(
            playerId,
            playerName,
            teamId,
          );

          if (
            cachedImageUrl &&
            cachedImageUrl !== "" &&
            cachedImageUrl !== "/assets/matchdetaillogo/fallback_player.png"
          ) {
            console.log(
              `✅ [MyAvatarInfo-${componentId}] Got from player cache: ${cachedImageUrl}`,
            );
            imageCache.set(cacheKey, cachedImageUrl);
            return cachedImageUrl;
          }
        } catch (error) {
          console.log(
            `⚠️ [MyAvatarInfo-${componentId}] Cache system failed: ${(error as Error)?.message || error}`,
          );
        }

        // Quick fallback - try direct API-Sports URL if ID available
        if (playerId) {
          try {
            const directUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
            // Don't validate, just use it - faster loading
            console.log(
              `🚀 [MyAvatarInfo-${componentId}] Using direct API-Sports: ${directUrl}`,
            );
            imageCache.set(cacheKey, directUrl);
            return directUrl;
          } catch (error) {
            console.log(
              `⚠️ [MyAvatarInfo-${componentId}] Direct API-Sports failed: ${error}`,
            );
          }
        }

        // All methods failed, cache the fallback to prevent future attempts
        console.log(
          `🎨 [MyAvatarInfo-${componentId}] Using fallback for: ${playerName}`,
        );
        imageCache.set(cacheKey, "/assets/matchdetaillogo/fallback_player.png");
        return "/assets/matchdetaillogo/fallback_player.png";
      } catch (error) {
        console.log(
          `❌ [MyAvatarInfo-${componentId}] Error loading image: ${(error as Error)?.message || error}`,
        );
        imageCache.set(cacheKey, "/assets/matchdetaillogo/fallback_player.png");
        return "/assets/matchdetaillogo/fallback_player.png";
      } finally {
        // Clean up loading request
        loadingRequests.delete(cacheKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    loadingRequests.set(cacheKey, loadPromise);
    return await loadPromise;
  };

  // Load image immediately without waiting for intersection
  useEffect(() => {
    if (!playerId && !playerName) return;

    let isCancelled = false;

    const loadImage = async () => {
      setIsLoading(true);

      try {
        const url = await loadPlayerImage();
        if (!isCancelled) {
          setImageUrl(url);
          // Preload the image for instant display
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.as = 'image';
          preloadLink.href = url;
          document.head.appendChild(preloadLink);
        }
      } catch (error) {
        if (!isCancelled) {
          console.log(
            `❌ [MyAvatarInfo-${componentId}] Failed to load: ${error}`,
          );
          setImageUrl("/assets/matchdetaillogo/fallback_player.png");
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
      const actualImageUrl =
        imageUrl !== "/assets/matchdetaillogo/fallback_player.png" ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // Show loading state only while actually loading
  if (isLoading) {
    return (
      <div
        ref={containerRef}
        className={`${sizeClasses[size]} border-2 border-gray-300 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-pulse ${className}`}
      ></div>
    );
  }

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
