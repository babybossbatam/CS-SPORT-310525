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
    const cleanName = playerName?.trim().toLowerCase() || "";
    const cleanId = playerId && playerId > 0 ? playerId : null;
    
    if (cleanId && cleanName) return `${cleanId}-${cleanName.replace(/\s+/g, '-')}`;
    if (cleanId) return `id-${cleanId}`;
    if (cleanName) return `name-${cleanName.replace(/\s+/g, '-')}`;
    return "unknown";
  }, [playerId, playerName]);

  // Optimized image loading with caching and deduplication
  const loadPlayerImage = async (): Promise<string> => {
    const fallbackUrl = "/assets/matchdetaillogo/fallback_player.png";
    
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

        // Try name-based search first (fastest if available)
        if (playerName && playerName.trim()) {
          try {
            const nameSearchUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName.trim())}`;
            const response = await fetch(nameSearchUrl, {
              method: "GET", // Use GET instead of HEAD to get actual response
            });

            if (response.ok) {
              const finalUrl = response.url;
              // Check if we got a real image URL (not a fallback)
              if (
                finalUrl &&
                !finalUrl.includes("ui-avatars.com") &&
                !finalUrl.includes("default.png") &&
                !finalUrl.includes("placeholder") &&
                !finalUrl.includes("fallback")
              ) {
                console.log(
                  `✅ [MyAvatarInfo-${componentId}] Found via name search: ${finalUrl}`,
                );
                imageCache.set(cacheKey, finalUrl);
                return finalUrl;
              }
            }
          } catch (error) {
            console.log(
              `⚠️ [MyAvatarInfo-${componentId}] Name search failed: ${error}`,
            );
          }
        }

        // Try ID-based search as backup
        if (playerId && playerId > 0) {
          try {
            const idSearchUrl = `/api/player-photo/${playerId}`;
            const response = await fetch(idSearchUrl, {
              method: "GET",
            });

            if (response.ok) {
              const finalUrl = response.url;
              if (
                finalUrl &&
                !finalUrl.includes("ui-avatars.com") &&
                !finalUrl.includes("default.png") &&
                !finalUrl.includes("placeholder") &&
                !finalUrl.includes("fallback")
              ) {
                console.log(
                  `✅ [MyAvatarInfo-${componentId}] Found via ID search: ${finalUrl}`,
                );
                imageCache.set(cacheKey, finalUrl);
                return finalUrl;
              }
            }
          } catch (error) {
            console.log(
              `⚠️ [MyAvatarInfo-${componentId}] ID search failed: ${error}`,
            );
          }
        }

        // Try cached system as final backup
        try {
          const cachedImageUrl = await getPlayerImage(
            playerId,
            playerName,
            teamId,
          );

          if (
            cachedImageUrl &&
            cachedImageUrl !== "" &&
            cachedImageUrl !== fallbackUrl &&
            !cachedImageUrl.includes("ui-avatars.com") &&
            !cachedImageUrl.includes("default.png") &&
            !cachedImageUrl.includes("placeholder")
          ) {
            console.log(
              `✅ [MyAvatarInfo-${componentId}] Got from player cache: ${cachedImageUrl}`,
            );
            imageCache.set(cacheKey, cachedImageUrl);
            return cachedImageUrl;
          }
        } catch (error) {
          console.log(
            `❌ [MyAvatarInfo-${componentId}] Cache system error: ${(error as Error)?.message || error}`,
          );
        }

        // All methods failed, use fallback but don't cache it permanently
        console.log(
          `🎨 [MyAvatarInfo-${componentId}] Using fallback for: ${playerName} (ID: ${playerId})`,
        );
        return fallbackUrl;
      } catch (error) {
        console.log(
          `❌ [MyAvatarInfo-${componentId}] Error loading image: ${(error as Error)?.message || error}`,
        );
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

  // Immediate image loading without intersection observer
  useEffect(() => {
    // Validate we have meaningful player data
    if ((!playerId || playerId <= 0) && (!playerName || !playerName.trim())) {
      console.log(`⚠️ [MyAvatarInfo-${componentId}] No valid player data, using fallback`);
      setImageUrl("/assets/matchdetaillogo/fallback_player.png");
      setIsLoading(false);
      setIsVisible(true);
      return;
    }

    let isCancelled = false;

    const loadImageImmediately = async () => {
      // Check cache first for instant loading
      if (imageCache.has(cacheKey)) {
        const cachedUrl = imageCache.get(cacheKey)!;
        console.log(`⚡ [MyAvatarInfo-${componentId}] Instant cache hit: ${cachedUrl}`);
        setImageUrl(cachedUrl);
        setIsLoading(false);
        setIsVisible(true);
        return;
      }

      // If not in cache, start loading immediately
      setIsLoading(true);
      setIsVisible(true);

      try {
        const url = await loadPlayerImage();
        if (!isCancelled) {
          setImageUrl(url);
          setIsLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.log(
            `❌ [MyAvatarInfo-${componentId}] Failed to load: ${error}`,
          );
          setImageUrl("/assets/matchdetaillogo/fallback_player.png");
          setIsLoading(false);
        }
      }
    };

    loadImageImmediately();

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
      const actualImageUrl =
        imageUrl !== "/assets/matchdetaillogo/fallback_player.png" ? imageUrl : undefined;
      onClick(playerId, teamId, playerName, actualImageUrl);
    }
  };

  // Early return for loading state (only show loading if no cached image)
  if (isLoading && !imageCache.has(cacheKey)) {
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
            `🖼️ [MyAvatarInfo-${componentId}] Image error for URL: ${imageUrl}, using fallback`,
          );
          // Only set fallback if current URL is not already the fallback
          if (imageUrl !== "/assets/matchdetaillogo/fallback_player.png") {
            // Remove failed URL from cache
            imageCache.delete(cacheKey);
            setImageUrl("/assets/matchdetaillogo/fallback_player.png");
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
