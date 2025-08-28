import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";
import MyWorldTeamLogo from "./MyWorldTeamLogo";
import { leagueLogoCache } from "@/lib/logoCache"; // Assuming leagueLogoCache is imported and available

interface LazyImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  // Team logo specific props
  useTeamLogo?: boolean;
  teamId?: number | string;
  teamName?: string;
  teamLogo?: string; // For fallback from currentMatch.teams.home.logo
  leagueContext?: {
    name?: string;
    country?: string;
  };
  priority?: 'high' | 'medium' | 'low';
}

// Single unified cache for all images
const unifiedImageCache = new Map<string, {
  url: string;
  timestamp: number;
  verified: boolean;
}>();

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  title,
  className = "",
  style,
  loading = "lazy",
  onLoad,
  onError,
  useTeamLogo = false,
  teamId,
  teamName,
  teamLogo,
  leagueContext,
  priority = 'low',
}) => {
  // Get dark mode state from Redux store first
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Enhanced immediate source resolution - no delays for local assets and cached items
  const getImmediateSource = (url: string, altText: string, isDarkMode: boolean) => {
    const altLower = altText?.toLowerCase() || '';

    // League logo local assets - return immediately
    if (altLower.includes("champions league") || altLower.includes("uefa champions")) {
      console.log(`🏆 [LazyImage] Using local Champions League logo (${isDarkMode ? 'dark' : 'light'}) mode) from start`);
      return isDarkMode ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png";
    }
    if (altLower.includes("premier league")) {
      console.log(`🏆 [LazyImage] Using local Premier League logo from start`);
      return "/assets/league-logos/39.png";
    }
    if (altLower.includes("cotif") || altLower.includes("cotif tournament")) {
      console.log(`🏆 [LazyImage] Using local COTIF Tournament logo from start`);
      return "/assets/matchdetaillogo/cotif tournament.png";
    }
    
    // Egyptian Premier League - common league IDs: 42, 233, 294
    if (altLower.includes("premier league") && (altLower.includes("egypt") || url.includes("/42") || url.includes("/233") || url.includes("/294"))) {
      console.log(`🇪🇬 [LazyImage] Egyptian Premier League detected, using server proxy`);
      const egyptianLeagueId = url.match(/\/(\d+)/)?.[1] || "233"; // Default to 233 if can't extract
      return `/api/league-logo/${egyptianLeagueId}`;
    }

    // Team logo local assets
    if (altLower.includes("valencia") && !altLower.includes("rayo vallecano")) {
      console.log(`⚽ [LazyImage] Using local Valencia logo from start`);
      return "/assets/matchdetaillogo/valencia.png";
    }
    if (altLower.includes("alboraya") || altLower.includes("albaroya")) {
      console.log(`⚽ [LazyImage] Using local Alboraya logo from start`);
      return "/assets/matchdetaillogo/alboraya.png";
    }

    // Check cache for immediate response
    if (url.startsWith('/api/league-logo/')) {
      const leagueId = url.match(/\/api\/league-logo\/(\d+)/)?.[1];
      if (leagueId) {
        const cached = leagueLogoCache.getCached(`league_${leagueId}`);
        if (cached?.url) {
          console.log(`💾 [LazyImage] Cache hit for league ${leagueId}: ${cached.url}`);
          return cached.url;
        }
      }
    }

    // Check unified cache
    const cacheKey = `img_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const cached = unifiedImageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`💾 [LazyImage] Unified cache hit for ${altText}: ${cached.url}`);
      return cached.url;
    }

    // For league logos, prioritize our server proxy endpoint
    if (url.includes("/api/league-logo/") || url.includes("media.api-sports.io/football/leagues/") || url.includes("imagecache.365scores.com")) {
      const leagueIdMatch = url.match(/(?:leagues?\/|logo\/(?:square\/)?|Competitions\/)(\d+)/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        console.log(`🏆 [LazyImage] League logo detected, using our server proxy for league ${leagueId}`);
        return `/api/league-logo/${leagueId}`;
      }
    }

    // Return original URL as fallback
    return url;
  };

  // Get immediate source without any async operations
  const immediateSource = getImmediateSource(src, alt, darkMode);
  const isLocalAsset = immediateSource.startsWith('/assets/') || immediateSource !== src;

  const [imageSrc, setImageSrc] = useState<string>(immediateSource);
  const [isLoading, setIsLoading] = useState<boolean>(!isLocalAsset);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Get device info for responsive sizing
  const { isMobile } = useDeviceInfo();

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  const fallbackUrl = "/assets/matchdetaillogo/fallback.png";

  // Simple cache key generation
  const getCacheKey = (url: string) => `img_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Check unified cache
  const getCachedImage = (url: string) => {
    const cacheKey = getCacheKey(url);
    const cached = unifiedImageCache.get(cacheKey);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      // Use cached version if less than CACHE_DURATION old
      if (age < CACHE_DURATION) {
        console.log(`🚀 [LazyImage] Cache hit for ${alt}: ${cached.url}`);
        return cached.url;
      } else {
        // Remove expired cache entry
        unifiedImageCache.delete(cacheKey);
      }
    }
    return null;
  };

  // Set cache
  const setCachedImage = (originalUrl: string, finalUrl: string, verified: boolean = true) => {
    const cacheKey = getCacheKey(originalUrl);
    unifiedImageCache.set(cacheKey, {
      url: finalUrl,
      timestamp: Date.now(),
      verified
    });
    console.log(`💾 [LazyImage] Cached ${alt}: ${finalUrl}`);
  };

  

  useEffect(() => {
    // Re-evaluate immediate source when dependencies change
    const newImmediateSource = getImmediateSource(src, alt, darkMode);
    const newIsLocalAsset = newImmediateSource.startsWith('/assets/') || newImmediateSource !== src;
    
    // Only update if the source has actually changed
    if (imageSrc !== newImmediateSource) {
      setImageSrc(newImmediateSource);
      setIsLoading(!newIsLocalAsset); // No loading for local assets
      setHasError(false);
      setRetryCount(0);
    }
  }, [src, alt, darkMode]);

  const handleError = () => {
    // Safety check to prevent cascading errors
    try {
      console.log(`🚫 [LazyImage] Image failed to load:`, {
        imageSrc: imageSrc,
        alt: alt,
        originalSrc: src,
        retryCount,
        hasTeamInfo: !!(teamId && teamName),
        useTeamLogo,
        timestamp: new Date().toISOString()
      });

      // Prevent infinite retry loops - allow more retries for league logos
      const maxRetries = imageSrc.includes('league') || alt.toLowerCase().includes('league') ? 4 : 3;
      if (retryCount >= maxRetries) {
        console.warn(`🚨 [LazyImage] Max retries (${maxRetries}) reached for ${alt}, using fallback immediately`);
        setImageSrc(fallbackUrl);
        setHasError(true);
        setIsLoading(false); // Ensure loading stops
        onError?.();
        return;
      }

      // If already on fallback URL, stop trying and set loading to false
      if (imageSrc === fallbackUrl || imageSrc.includes('fallback')) {
        console.log(`✅ [LazyImage] Fallback image loaded for ${alt}`);
        setHasError(false);
        setIsLoading(false);
        onError?.();
        return;
      }

      // Attempt to use fallback sources based on image type and retry count
      const altLower = alt?.toLowerCase() || '';

      // Special team handling - Al-Nassr example
      if (altLower.includes("al-nassr") || altLower.includes("al nassr")) {
        if (retryCount === 0) {
          const alNassrUrl = "https://media.api-sports.io/football/teams/2939.png";
          console.log(`⚽ [LazyImage] Trying Al-Nassr logo (attempt 1): ${alNassrUrl}`);
          setImageSrc(alNassrUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        } else if (retryCount === 1) {
          // Try 365scores as alternative
          const alNassr365Url = "https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/2939";
          console.log(`⚽ [LazyImage] Trying Al-Nassr logo (attempt 2): ${alNassr365Url}`);
          setImageSrc(alNassr365Url);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        } else {
          console.log(`⚽ [LazyImage] Using fallback for Al-Nassr team after all retries`);
          setImageSrc(fallbackUrl);
          setHasError(true); // Mark as error to prevent further retries on fallback
          setIsLoading(false); // Set loading to false for fallback
          return;
        }
      }

      // Al-Ittihad team - try multiple logo sources
      if (altLower.includes("al-ittihad") || altLower.includes("al ittihad")) {
        if (retryCount === 0) {
          const alIttihadUrl = "https://media.api-sports.io/football/teams/2940.png";
          console.log(`⚽ [LazyImage] Trying Al-Ittihad logo (attempt 1): ${alIttihadUrl}`);
          setImageSrc(alIttihadUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        } else if (retryCount === 1) {
          // Try 365scores as alternative
          const alIttihad365Url = "https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/2940";
          console.log(`⚽ [LazyImage] Trying Al-Ittihad logo (attempt 2): ${alIttihad365Url}`);
          setImageSrc(alIttihad365Url);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        } else {
          console.log(`⚽ [LazyImage] Using fallback for Al-Ittihad team after all retries`);
          setImageSrc(fallbackUrl);
          setHasError(true);
          setIsLoading(true);
          return;
        }
      }

      // Al-Qadisiyah FC team
      if (altLower.includes("al-qadisiyah") || altLower.includes("al qadisiyah")) {
        console.log(`⚽ [LazyImage] Using Al-Qadisiyah logo`);
        setImageSrc("https://media.api-sports.io/football/teams/2942.png");
        setHasError(false);
        setIsLoading(true);
        return;
      }

      // Al-Ahli Jeddah team
      if ((altLower.includes("al-ahli") || altLower.includes("al ahli")) && altLower.includes("jeddah")) {
        console.log(`⚽ [LazyImage] Using Al-Ahli Jeddah logo`);
        setImageSrc("https://media.api-sports.io/football/teams/2941.png");
        setHasError(false);
        setIsLoading(true);
        return;
      }

      // Al-Hilal team
      if (altLower.includes("al-hilal") || altLower.includes("al hilal")) {
        console.log(`⚽ [LazyImage] Using Al-Hilal logo`);
        setImageSrc("https://media.api-sports.io/football/teams/2938.png");
        setHasError(false);
        setIsLoading(true);
        return;
      }

      // Al-Shabab team
      if (altLower.includes("al-shabab") || altLower.includes("al shabab")) {
        console.log(`⚽ [LazyImage] Using Al-Shabab logo`);
        setImageSrc("https://media.api-sports.io/football/teams/2943.png");
        setHasError(false);
        setIsLoading(true);
        return;
      }

      // Enhanced league logo fallback strategy
      const isLeagueLogo = imageSrc.includes("/api/league-logo/") ||
                          imageSrc.includes("media.api-sports.io/football/leagues/") ||
                          imageSrc.includes("imagecache.365scores.com") ||
                          imageSrc.includes("/Competitions/");

      if (isLeagueLogo) {
        // Extract league ID for better debugging
        let leagueId = "unknown";
        const apiMatch = imageSrc.match(
          /\/api\/league-logo\/(?:square\/)?(\d+)/,
        );
        const mediaMatch = imageSrc.match(
          /media\.api-sports\.io\/football\/leagues\/(\d+)/,
        );
        const scoresMatch = imageSrc.match(/Competitions\/(\d+)/);

        if (apiMatch) leagueId = apiMatch[1];
        else if (mediaMatch) leagueId = mediaMatch[1];
        else if (scoresMatch) leagueId = scoresMatch[1];

        // Special handling for well-known leagues with local assets
        const altLower = alt?.toLowerCase() || '';
        if (altLower.includes("premier league") || leagueId === "39") {
          if (retryCount === 0) {
            console.log(`🏆 [LazyImage] Using Premier League local asset`);
            setImageSrc("/assets/league-logos/39.png");
            setRetryCount(retryCount + 1);
            setIsLoading(true);
            return;
          }
        }

        if (altLower.includes("champions league") || altLower.includes("uefa champions") || leagueId === "2") {
          if (retryCount === 0) {
            console.log(`🏆 [LazyImage] Using Champions League local asset`);
            setImageSrc(darkMode ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png");
            setRetryCount(retryCount + 1);
            setIsLoading(true);
            return;
          }
        }

        console.log(
          `🏆 [LazyImage] League logo error detected for: ${alt} (ID: ${leagueId})`,
          {
            imageSrc,
            retryCount,
            hasError,
            leagueId,
          },
        );

          // First retry: try our square API endpoint
          if (retryCount === 0) {
            if (leagueId !== "unknown") {
              const squareApiUrl = `/api/league-logo/square/${leagueId}`;
              console.log(
                `🏆 [LazyImage] League logo fallback: trying square API for ${leagueId}`,
              );
              setImageSrc(squareApiUrl);
              setRetryCount(retryCount + 1);
              setIsLoading(true);
              return;
            }
          }

          // Second retry: try direct API-Sports URL
          if (retryCount === 1) {
            if (leagueId !== "unknown") {
              const directApiUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
              console.log(
                `🏆 [LazyImage] League logo second attempt: trying direct API-Sports for ${leagueId}`,
              );
              setImageSrc(directApiUrl);
              setRetryCount(retryCount + 1);
              setIsLoading(true);
              return;
            }
          }

          // Third retry: try 365scores
          if (retryCount === 2) {
            if (leagueId !== "unknown") {
              const scoresUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitions/${leagueId}`;
              console.log(
                `🏆 [LazyImage] League logo third attempt: trying 365scores for ${leagueId}`,
              );
              setImageSrc(scoresUrl);
              setRetryCount(retryCount + 1);
              setIsLoading(true);
              return;
            }
        }
      }

      // Try teamLogo prop as a general fallback if it's different from current src
      if (teamLogo && !imageSrc.includes(teamLogo) && retryCount < 3) { // Limit retries on teamLogo too
        console.log(`🔄 [LazyImage] Trying teamLogo fallback: ${teamLogo}`);
        setImageSrc(teamLogo);
        setRetryCount(retryCount + 1);
        setIsLoading(true);
        return;
      }

      // Try alternative API endpoint for team logos if teamId is available
      if (teamId && retryCount < 2 && !imageSrc.includes('/api/team-logo/')) {
        console.log(`🔄 [LazyImage] Trying API team logo endpoint for ${teamName} (ID: ${teamId})`);
        setImageSrc(`/api/team-logo/square/${teamId}?size=32`);
        setRetryCount(retryCount + 1);
        setIsLoading(true);
        return;
      }

      // Final fallback if all attempts fail
      console.warn(
        `🚫 [LazyImage] All retries failed for: ${src} (${retryCount + 1} attempts), using fallback`,
        {
          originalSrc: src,
          currentSrc: imageSrc,
          teamInfo: { teamId, teamName },
          retryCount,
          alt,
          timestamp: new Date().toISOString()
        }
      );
      setHasError(true);
      setImageSrc(fallbackUrl);
      setIsLoading(false); // Ensure loading stops for fallback
      setRetryCount(999); // Prevent further retries

      // Call onError callback only after setting fallback
      onError?.();

    } catch (error) {
      console.warn("⚠️ [LazyImage] Error in handleError function:", error);
      setHasError(true);
      setImageSrc(fallbackUrl);
      setIsLoading(false); // Ensure loading is false on unexpected errors
      onError?.();
    }
  };

  const handleLoad = () => {
    // Always reset loading state when any image loads successfully
    setIsLoading(false);

    // Don't cache or log success for fallback images
    const isFallbackImage =
      imageSrc.includes("/assets/matchdetaillogo/fallback.png") ||
      imageSrc.includes("/assets/fallback-logo.svg") ||
      imageSrc.includes("fallback") ||
      imageSrc.includes("placeholder");

    if (isFallbackImage) {
      console.log(
        `✅ [LazyImage] Fallback image loaded successfully: ${imageSrc}`,
      );
      setHasError(false); // Ensure hasError is false if a fallback loads
      setRetryCount(999); // Prevent further attempts
      onLoad?.();
      return;
    }

    // Check for local asset success and don't cache them again
    const isLocalAsset =
      imageSrc.includes("/assets/matchdetaillogo/cotif tournament.png") ||
      imageSrc.includes("/assets/matchdetaillogo/valencia.png") ||
      imageSrc.includes("/assets/matchdetaillogo/alboraya.png") ||
      imageSrc.includes("/assets/matchdetaillogo/uefa.png") ||
      imageSrc.includes("/assets/matchdetaillogo/uefa-white.png");

    if (isLocalAsset) {
      console.log(`✅ [LazyImage] Local asset loaded successfully: ${imageSrc}`);
      setHasError(false);
      onLoad?.();
      return;
    }

    // Enhanced league logo success logging (only for real logos)
    const isLeagueLogo =
      imageSrc.includes("/api/league-logo/") ||
      imageSrc.includes("media.api-sports.io/football/leagues/") ||
      imageSrc.includes("imagecache.365scores.com");

    if (isLeagueLogo) {
      // Extract league ID and source for better tracking
      let leagueId = "unknown";
      let source = "unknown";

      const apiMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
      const mediaMatch = imageSrc.match(
        /media\.api-sports\.io\/football\/leagues\/(\d+)/,
      );
      const scoresMatch = imageSrc.match(/Competitions\/(\d+)/);

      if (apiMatch) {
        leagueId = apiMatch[1];
        source = imageSrc.includes("/square/") ? "api-square" : "api-proxy";
      } else if (mediaMatch) {
        leagueId = mediaMatch[1];
        source = "api-sports-direct";
      } else if (scoresMatch) {
        leagueId = scoresMatch[1];
        source = "365scores";
      }

      console.log(
        `🏆 [LazyImage] League logo loaded successfully (REAL LOGO):`,
        {
          alt,
          leagueId,
          source,
          imageSrc,
          retryCount,
          wasError: hasError,
          component: "LazyImage",
        },
      );
    }

    if (hasError) {
      console.log(`✅ [LazyImage] Recovered and loaded real logo: ${imageSrc}`);
    }

    // Cache successful logo loads (only if not a fallback or local asset)
    if (!isFallbackImage && !isLocalAsset) {
      setCachedImage(src, imageSrc, true);
    }

    setHasError(false); // Ensure hasError is false on successful load
    onLoad?.();
  };


  // Use MyWorldTeamLogo if team information is provided and useTeamLogo is true
  if (useTeamLogo && teamId && teamName) {
    return (
      <MyWorldTeamLogo
        teamName={teamName}
        teamId={teamId}
        teamLogo={imageSrc}
        alt={alt}
        size={style?.width || style?.height || "32px"}
        className={className}
        leagueContext={leagueContext}
      />
    );
  }

  // Enhanced player image detection and prevention
  if (alt && imageSrc) {
    // Comprehensive player photo URL patterns
    const isPlayerPhoto = imageSrc.includes('/players/') ||
                         imageSrc.includes('Athletes/') ||
                         imageSrc.includes('player-') ||
                         imageSrc.includes('/headshots/') ||
                         imageSrc.includes('_headshot') ||
                         imageSrc.includes('player_') ||
                         imageSrc.includes('/athlete/') ||
                         imageSrc.includes('/persons/') ||
                         imageSrc.includes('/portraits/') ||
                         imageSrc.includes('playerheadshots') ||
                         imageSrc.includes('playerimages') ||
                         imageSrc.includes('mugshots') ||
                         // 365scores specific player patterns
                         imageSrc.includes('365scores.com') && (
                           imageSrc.includes('Athletes') ||
                           imageSrc.includes('player') ||
                           imageSrc.includes('headshot')
                         ) ||
                         // RapidAPI player patterns
                         imageSrc.includes('media.api-sports.io') && imageSrc.includes('/players/') ||
                         // Generic person/face detection patterns
                         imageSrc.match(/\/(player|athlete|person|headshot|mugshot|portrait)/i);

    // Team context detection - any team name or logo context
    const isTeamContext = alt.toLowerCase().includes('vs') ||
                         alt.toLowerCase().includes('team') ||
                         alt.toLowerCase().includes('logo') ||
                         alt.toLowerCase().includes('home') ||
                         alt.toLowerCase().includes('away') ||
                         alt.toLowerCase().includes('club') ||
                         alt.toLowerCase().includes('fc') ||
                         alt.toLowerCase().includes('united') ||
                         alt.toLowerCase().includes('city') ||
                         alt.toLowerCase().includes('rapids') ||
                         alt.toLowerCase().includes('timbers') ||
                         alt.toLowerCase().includes('texoma') ||
                         alt.toLowerCase().includes('alta') ||
                         alt.toLowerCase().includes('union') ||
                         alt.toLowerCase().includes('omaha') ||
                         alt.toLowerCase().includes('charlotte') ||
                         // League contexts
                         alt.toLowerCase().includes('usl') ||
                         alt.toLowerCase().includes('mls') ||
                         alt.toLowerCase().includes('league') ||
                         // Generic team indicators
                         className?.includes('team') ||
                         className?.includes('logo') ||
                         // Check if this is being used in match/fixture context
                         alt.match(/\b(vs?\.?|versus|against|\-)\b/i);

    // Additional check: if the image dimensions suggest it's a small logo/icon
    const isLogoSize = (style?.width && parseInt(style.width as string) <= 64) ||
                      (style?.height && parseInt(style.height as string) <= 64) ||
                      className?.includes('w-6') || className?.includes('h-6') ||
                      className?.includes('w-8') || className?.includes('h-8');

    if (isPlayerPhoto && (isTeamContext || isLogoSize)) {
      console.warn(`🚨 [LazyImage] Player photo blocked in team/logo context:`, {
        alt,
        imageSrc,
        originalSrc: src,
        isTeamContext,
        isLogoSize,
        playerPhotoPatterns: {
          playersPath: imageSrc.includes('/players/'),
          athletes: imageSrc.includes('Athletes/'),
          headshots: imageSrc.includes('headshot'),
          portraits: imageSrc.includes('portrait')
        },
        component: 'LazyImage'
      });

      // Force fallback immediately
      return (
        <img
          src={fallbackUrl}
          alt={alt}
          className={className}
          style={{
            ...style,
            border: 'none',
            outline: 'none',
            opacity: 1, // Ensure fallback is visible
            filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
            ...(style?.width || style?.height ? {} : {
             width: isMobile ? '32px' : '32px',
              height: isMobile ? '32px' : '32px'
            })
          }}
          loading={shouldPreload ? 'eager' : 'lazy'}
          decoding="async"
        />
      );
    }
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      title={title}
      className={className}
      style={{
        ...style,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        // Hide image if there's an error AND it's not the fallback URL already
        display: hasError && imageSrc !== fallbackUrl ? 'none' : 'inline-block',
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
        // Apply size from props if no explicit width/height in style
        ...(style?.width || style?.height ? {} : {
         width: isMobile ? '32px' : '32px',
          height: isMobile ? '32px' : '32px'
        })
      }}
      loading={shouldPreload ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;