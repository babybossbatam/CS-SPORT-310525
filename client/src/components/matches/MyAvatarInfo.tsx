
import React, { useState, useEffect, useRef, useMemo } from "react";

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

// Optimized single cache system with longer TTL and validation tracking
interface CachedImage {
  url: string;
  timestamp: number;
  validated: boolean;
  attempts: number;
}

const optimizedImageCache = new Map<string, CachedImage>();
const pendingRequests = new Map<string, Promise<string>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;
const MAX_VALIDATION_ATTEMPTS = 3;

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

  // Clean up cache if it gets too large
  const cleanupCache = () => {
    if (optimizedImageCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(optimizedImageCache.entries());
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(MAX_CACHE_SIZE * 0.3))
        .forEach(([key]) => optimizedImageCache.delete(key));
    }
  };

  // Optimized image validation with reduced overhead
  const validateImageUrl = async (url: string): Promise<boolean> => {
    if (!url || url.includes("fallback") || url.includes("ui-avatars.com")) {
      return false;
    }

    // For local API endpoints, use lightweight HEAD request
    if (url.startsWith('/api/')) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          cache: 'force-cache' // Leverage browser cache
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    // For external URLs, use faster validation with timeout
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = img.onerror = null;
        resolve(false);
      }, 1500); // Reduced timeout

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

  // Optimized image loading with parallel requests and smart caching
  const loadPlayerImage = async (): Promise<string> => {
    // Check cache first with validation tracking
    const cached = optimizedImageCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) {
        // If recently validated or under attempt limit, use cached
        if (cached.validated || cached.attempts < MAX_VALIDATION_ATTEMPTS) {
          console.log(`💾 [MyAvatarInfo-${componentId}] Using cached: ${cached.url}`);
          return cached.url;
        }
      } else {
        // Remove expired cache
        optimizedImageCache.delete(cacheKey);
      }
    }

    // Check if request is already in progress
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ [MyAvatarInfo-${componentId}] Request in progress, waiting...`);
      return await pendingRequests.get(cacheKey)!;
    }

    // Create new optimized request with parallel API calls
    const loadPromise = (async (): Promise<string> => {
      try {
        console.log(`🔍 [MyAvatarInfo-${componentId}] Loading image for: ${playerName} (ID: ${playerId})`);

        // Prepare all potential URLs for parallel testing
        const urlsToTest: string[] = [];
        
        if (playerName) {
          urlsToTest.push(`/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`);
        }
        
        if (playerId) {
          urlsToTest.push(`/api/player-photo/${playerId}`);
          urlsToTest.push(`https://media.api-sports.io/football/players/${playerId}.png`);
          urlsToTest.push(`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`);
        }

        // Test URLs in parallel with Promise.allSettled for better performance
        const validationPromises = urlsToTest.map(async (url) => {
          const isValid = await validateImageUrl(url);
          return { url, isValid };
        });

        const results = await Promise.allSettled(validationPromises);
        
        // Find first valid URL
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.isValid) {
            const validUrl = result.value.url;
            console.log(`✅ [MyAvatarInfo-${componentId}] Found valid image: ${validUrl}`);
            
            // Cache with validation flag
            optimizedImageCache.set(cacheKey, {
              url: validUrl,
              timestamp: Date.now(),
              validated: true,
              attempts: 1
            });
            
            cleanupCache();
            return validUrl;
          }
        }

        // All methods failed, use static fallback
        console.log(`🎨 [MyAvatarInfo-${componentId}] Using static fallback for: ${playerName}`);
        const fallbackUrl = "/assets/matchdetaillogo/player_fallback.png";
        
        // Cache fallback with attempt tracking
        optimizedImageCache.set(cacheKey, {
          url: fallbackUrl,
          timestamp: Date.now(),
          validated: false,
          attempts: (cached?.attempts || 0) + 1
        });
        
        return fallbackUrl;
      } catch (error) {
        console.log(`❌ [MyAvatarInfo-${componentId}] Error loading image: ${(error as Error)?.message || error}`);
        const fallbackUrl = "/assets/matchdetaillogo/player_fallback.png";
        
        optimizedImageCache.set(cacheKey, {
          url: fallbackUrl,
          timestamp: Date.now(),
          validated: false,
          attempts: (cached?.attempts || 0) + 1
        });
        
        return fallbackUrl;
      } finally {
        // Clean up pending request
        pendingRequests.delete(cacheKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    pendingRequests.set(cacheKey, loadPromise);
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
      { rootMargin: "50px", threshold: 0.1 }, // Reduced rootMargin
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
          setImageUrl(url || "/assets/matchdetaillogo/player_fallback.png");
        }
      } catch (error) {
        console.log(`❌ [MyAvatarInfo-${componentId}] Failed to load: ${error}`);
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

  // Early return for loading state - show skeleton
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
        loading="lazy" // Enable browser lazy loading
        onError={() => {
          console.log(`🖼️ [MyAvatarInfo-${componentId}] Image error, using static fallback`);
          // Update cache to mark as invalid and use fallback
          const fallbackUrl = "/assets/matchdetaillogo/player_fallback.png";
          const cached = optimizedImageCache.get(cacheKey);
          optimizedImageCache.set(cacheKey, {
            url: fallbackUrl,
            timestamp: Date.now(),
            validated: false,
            attempts: (cached?.attempts || 0) + 1
          });
          setImageUrl(fallbackUrl);
        }}
        onLoad={() => {
          console.log(`✅ [MyAvatarInfo-${componentId}] Image loaded: ${imageUrl}`);
        }}
      />
    </div>
  );
};

export default MyAvatarInfo;
