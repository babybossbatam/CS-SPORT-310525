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

  const [imageUrl, setImageUrl] = useState<string>("");
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

  // Optimized image loading with parallel requests and better caching
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

    // Create new request with parallel loading
    const loadPromise = (async (): Promise<string> => {
      try {
        console.log(
          `🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`,
        );

        // Create all requests in parallel with shorter timeouts
        const requests: Promise<string | null>[] = [];

        // Name-based search (fastest)
        if (playerName) {
          requests.push(
            fetch(`/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`, {
              method: "HEAD",
              signal: AbortSignal.timeout(1500), // Reduced timeout
            })
              .then(response => {
                if (response.ok && response.url && !response.url.includes("ui-avatars.com") && 
                    !response.url.includes("fallback_player")) {
                  return response.url;
                }
                return null;
              })
              .catch(() => null)
          );
        }

        // ID-based search
        if (playerId) {
          requests.push(
            fetch(`/api/player-photo/${playerId}`, {
              method: "HEAD",
              signal: AbortSignal.timeout(1500), // Reduced timeout
            })
              .then(response => {
                if (response.ok && response.url && !response.url.includes("ui-avatars.com") && 
                    !response.url.includes("fallback_player")) {
                  return response.url;
                }
                return null;
              })
              .catch(() => null)
          );
        }

        // Cache system search
        requests.push(
          getPlayerImage(playerId, playerName, teamId)
            .then(url => {
              if (url && url !== "/assets/matchdetaillogo/player_fallback.png" &&
                  !url.includes("ui-avatars.com") && !url.includes("fallback_player")) {
                return url;
              }
              return null;
            })
            .catch(() => null)
        );

        // Wait for the first successful response
        const results = await Promise.allSettled(requests);
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            console.log(
              `✅ [MyAvatarInfo-${componentId}] Found valid image: ${result.value}`,
            );
            imageCache.set(cacheKey, result.value);
            return result.value;
          }
        }

        // All methods failed, use static fallback image
        console.log(
          `🎨 [MyAvatarInfo-${componentId}] Using static fallback for: ${playerName}`,
        );
        const fallbackUrl = "/assets/matchdetaillogo/player_fallback.png";
        imageCache.set(cacheKey, fallbackUrl);
        return fallbackUrl;
      } catch (error) {
        console.log(
          `❌ [MyAvatarInfo-${componentId}] Error loading image: ${(error as Error)?.message || error}`,
        );
        const fallbackUrl = "/assets/matchdetaillogo/player_fallback.png";
        imageCache.set(cacheKey, fallbackUrl);
        return fallbackUrl;
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
      { rootMargin: "200px", threshold: 0.05 }, // Increased rootMargin and reduced threshold for even earlier loading
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
          // Only set the URL if we got a real image, not the fallback
          setImageUrl(url || "/assets/matchdetaillogo/player_fallback.png");
        }
      } catch (error) {
        console.log(
            `❌ [MyAvatarInfo-${componentId}] Failed to load: ${error}`,
          );
        if (!isCancelled) {
          setImageUrl("/assets/matchdetaillogo/player_fallback.png");
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
        imageUrl !== "/assets/matchdetaillogo/player_fallback.png" ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // Early return for loading state - show skeleton, not fallback image
  if (!isVisible || isLoading || !imageUrl) {
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
        loading="lazy"
        decoding="async"
        onError={() => {
          console.log(
            `🖼️ [MyAvatarInfo-${componentId}] Image error, using static fallback`,
          );
          // Remove from cache and use static fallback
          const fallbackUrl = "/assets/matchdetaillogo/player_fallback.png";
          imageCache.set(cacheKey, fallbackUrl);
          setImageUrl(fallbackUrl);
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