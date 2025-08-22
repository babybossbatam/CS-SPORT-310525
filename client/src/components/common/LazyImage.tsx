import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";
import MyWorldTeamLogo from "./MyWorldTeamLogo";

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
  // Note: For team logos, consider using MyWorldTeamLogo instead of LazyImage
  // LazyImage is better suited for general images, league logos, and non-team assets
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get dark mode state from Redux store
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Get device info for responsive sizing
  const { isMobile } = useDeviceInfo();

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  const fallbackUrl = "/assets/matchdetaillogo/fallback.png";

  useEffect(() => {
    // Reset state when src changes
    setHasError(false);
    setRetryCount(0);
    setIsLoading(true);

    // Check browser cache first for previously successful loads
    const checkBrowserCache = () => {
      try {
        const cacheKey = `logo_${src.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { url, timestamp, verified } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          // Use cached version if less than 1 hour old and verified
          if (age < 60 * 60 * 1000 && url && verified) {
            console.log(`🔄 [LazyImage] Using browser cached logo: ${url}`);
            return url;
          }
        }
      } catch (error) {
        // Ignore cache errors
      }
      return null;
    };

    const cachedUrl = checkBrowserCache();
    if (cachedUrl && cachedUrl !== src) {
      setImageSrc(cachedUrl);
      setHasError(false);
      setRetryCount(0);
      setIsLoading(false);
      return;
    }

    // Check for specific teams/leagues that should use local assets immediately
      const shouldUseLocalAsset = () => {
        if (alt) {
          const altLower = alt.toLowerCase();

          // Champions League only - use theme-appropriate logo
          if (altLower.includes("champions league")) {
            const championsLogo = darkMode ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png";
            console.log(`🏆 [LazyImage] Using local Champions League logo (${darkMode ? 'dark' : 'light'}) mode) from start: ${championsLogo}`);
            return championsLogo;
          }

          // COTIF Tournament league
          if (altLower.includes("cotif") || altLower.includes("cotif tournament")) {
            console.log(`🏆 [LazyImage] Using local COTIF Tournament logo from start`);
            return "/assets/matchdetaillogo/cotif tournament.png";
          }

          // Valencia team (including U20)
          if (altLower.includes("valencia") && !altLower.includes("rayo vallecano")) {
            console.log(`⚽ [LazyImage] Using local Valencia logo from start`);
            return "/assets/matchdetaillogo/valencia.png";
          }

          // Alboraya team (including U20)
          if (altLower.includes("alboraya") || altLower.includes("albaroya")) {
            console.log(`⚽ [LazyImage] Using local Alboraya logo from start`);
            return "/assets/matchdetaillogo/alboraya.png";
          }
        }
        return null;
      };

      const localAssetUrl = shouldUseLocalAsset();

      if (localAssetUrl) {
        setImageSrc(localAssetUrl);
        setHasError(false);
        setRetryCount(0);
      } else {
        setImageSrc(src);
        setHasError(false);
        setRetryCount(0);
      }
    }, [src, alt, darkMode]); // Add darkMode to trigger re-evaluation when theme changes

    const handleError = () => {
    // Safety check to prevent cascading errors
    try {
      // Enhanced debugging for team logos
      console.log(`🚫 [LazyImage] Image failed to load:`, {
        src: imageSrc,
        alt: alt,
        originalSrc: src,
        retryCount,
        hasTeamInfo: !!(teamId && teamName),
        useTeamLogo,
        timestamp: new Date().toISOString()
      });

      // Don't immediately set loading to false - give retries a chance
      if (retryCount >= 3) {
        setIsLoading(false);
      }

      // Check for specific teams/leagues that should use local assets
      const shouldUseLocalAsset = () => {
        if (alt) {
          const altLower = alt.toLowerCase();

          // Champions League only - use theme-appropriate logo
          if (altLower.includes("champions league")) {
            const championsLogo = darkMode ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png";
            setImageSrc(championsLogo);
            setHasError(false);
            setIsLoading(true);
            console.log(`🏆 [LazyImage] Using local Champions League logo (${darkMode ? 'dark' : 'light'} mode): ${championsLogo}`);
            return true;
          }

          // COTIF Tournament league
          if (altLower.includes("cotif") || altLower.includes("cotif tournament")) {
            setImageSrc("/assets/matchdetaillogo/cotif tournament.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`🏆 [LazyImage] Using local COTIF Tournament logo`);
            return true;
          }

          // Valencia team (including U20)
          if (altLower.includes("valencia") && !altLower.includes("rayo vallecano")) {
            setImageSrc("/assets/matchdetaillogo/valencia.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`⚽ [LazyImage] Using local Valencia logo`);
            return true;
          }

          // Alboraya team (including U20)
          if (altLower.includes("alboraya") || altLower.includes("albaroya")) {
            setImageSrc("/assets/matchdetaillogo/alboraya.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`⚽ [LazyImage] Using local Alboraya logo`);
            return true;
          }

          // Al-Nassr team - try multiple logo sources
          if (altLower.includes("al-nassr") || altLower.includes("al nassr")) {
            if (retryCount === 0) {
              const alNassrUrl = "https://media.api-sports.io/football/teams/2939.png";
              console.log(`⚽ [LazyImage] Trying Al-Nassr logo (attempt 1): ${alNassrUrl}`);
              setImageSrc(alNassrUrl);
              setHasError(false);
              setIsLoading(true);
              setRetryCount(retryCount + 1);
              return true;
            } else if (retryCount === 1) {
              // Try 365scores as alternative
              const alNassr365Url = "https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/2939";
              console.log(`⚽ [LazyImage] Trying Al-Nassr logo (attempt 2): ${alNassr365Url}`);
              setImageSrc(alNassr365Url);
              setHasError(false);
              setIsLoading(true);
              setRetryCount(retryCount + 1);
              return true;
            } else {
              console.log(`⚽ [LazyImage] Using fallback for Al-Nassr team after all retries`);
              setImageSrc(fallbackUrl);
              setHasError(false);
              setIsLoading(true);
              return true;
            }
          }

          // Al-Ittihad team - try multiple logo sources
          if (altLower.includes("al-ittihad") || altLower.includes("al ittihad")) {
            if (retryCount === 0) {
              const alIttihadUrl = "https://media.api-sports.io/football/teams/2940.png";
              console.log(`⚽ [LazyImage] Trying Al-Ittihad logo (attempt 1): ${alIttihadUrl}`);
              setImageSrc(alIttihadUrl);
              setHasError(false);
              setIsLoading(true);
              setRetryCount(retryCount + 1);
              return true;
            } else if (retryCount === 1) {
              // Try 365scores as alternative
              const alIttihad365Url = "https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/2940";
              console.log(`⚽ [LazyImage] Trying Al-Ittihad logo (attempt 2): ${alIttihad365Url}`);
              setImageSrc(alIttihad365Url);
              setHasError(false);
              setIsLoading(true);
              setRetryCount(retryCount + 1);
              return true;
            } else {
              console.log(`⚽ [LazyImage] Using fallback for Al-Ittihad team after all retries`);
              setImageSrc(fallbackUrl);
              setHasError(false);
              setIsLoading(true);
              return true;
            }
          }

          // Al-Qadisiyah FC team
          if (altLower.includes("al-qadisiyah") || altLower.includes("al qadisiyah")) {
            setImageSrc("https://media.api-sports.io/football/teams/2942.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`⚽ [LazyImage] Using Al-Qadisiyah logo`);
            return true;
          }

          // Al-Ahli Jeddah team
          if ((altLower.includes("al-ahli") || altLower.includes("al ahli")) && altLower.includes("jeddah")) {
            setImageSrc("https://media.api-sports.io/football/teams/2941.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`⚽ [LazyImage] Using Al-Ahli Jeddah logo`);
            return true;
          }

          // Al-Hilal team
          if (altLower.includes("al-hilal") || altLower.includes("al hilal")) {
            setImageSrc("https://media.api-sports.io/football/teams/2938.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`⚽ [LazyImage] Using Al-Hilal logo`);
            return true;
          }

          // Al-Shabab team
          if (altLower.includes("al-shabab") || altLower.includes("al shabab")) {
            setImageSrc("https://media.api-sports.io/football/teams/2943.png");
            setHasError(false);
            setIsLoading(true);
            console.log(`⚽ [LazyImage] Using Al-Shabab logo`);
            return true;
          }
        }
        return false;
      };

      const localAssetUsed = shouldUseLocalAsset();
      if (localAssetUsed) return;

      // Enhanced league logo handling like MyNewLeague2
      const isLeagueLogo =
        imageSrc.includes("/api/league-logo/") ||
        imageSrc.includes("media.api-sports.io/football/leagues/") ||
        imageSrc.includes("imagecache.365scores.com");

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

        console.log(
          `🏆 [LazyImage] League logo error detected for: ${alt} (ID: ${leagueId})`,
          {
            imageSrc,
            retryCount,
            hasError,
            leagueId,
          },
        );
      }

      if (!hasError && retryCount < 2) {
        // For team logos, try the teamLogo prop first if different from current src
        if (useTeamLogo && teamLogo && !imageSrc.includes(teamLogo) && retryCount === 0) {
          console.log(`🔄 [LazyImage] Trying teamLogo prop: ${teamLogo}`);
          setImageSrc(teamLogo);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }

        // Enhanced league logo fallback strategy
        if (isLeagueLogo && retryCount === 0) {
          // Extract league ID from various sources
          let leagueId = null;

          // From /api/league-logo/ID or /api/league-logo/square/ID
          const apiMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
          if (apiMatch) {
            leagueId = apiMatch[1];
          }

          // From media.api-sports.io/football/leagues/ID.png
          const mediaMatch = imageSrc.match(
            /media\.api-sports\.io\/football\/leagues\/(\d+)/,
          );
          if (mediaMatch) {
            leagueId = mediaMatch[1];
          }

          // From 365scores imagecache
          const scoresMatch = imageSrc.match(/Competitions\/(\d+)/);
          if (scoresMatch) {
            leagueId = scoresMatch[1];
          }

          if (leagueId) {
            // Try direct API-Sports URL first
            const directApiUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
            console.log(
              `🏆 [LazyImage] League logo fallback: trying direct API-Sports for ${leagueId}`,
            );
            setImageSrc(directApiUrl);
            setRetryCount(retryCount + 1);
            setIsLoading(true);
            return;
          }
        }

        // For team logos, try with cache busting
        if (useTeamLogo && retryCount === 1) {
          console.log(`🔄 [LazyImage] Retrying team logo with cache busting: ${src}`);
          setImageSrc(`${src}?t=${Date.now()}`);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }

        // Standard retry with cache busting for other images
        console.warn(
          `🖼️ [LazyImage] Retrying image load: ${imageSrc} (attempt ${retryCount + 1})`,
        );
        setImageSrc(`${src}?retry=${retryCount + 1}&t=${Date.now()}`);
        setRetryCount(retryCount + 1);
        setIsLoading(true);
      } else {
        // All retries failed, use fallback
        console.warn(
          `🚫 [LazyImage] All retries failed for: ${src} (${retryCount + 1} attempts), using fallback`,
        );
        setHasError(true);
        setImageSrc(fallbackUrl);
        setIsLoading(false);
        onError?.();
      }
    } catch (error) {
      console.warn("⚠️ [LazyImage] Error in handleError function:", error);
        setHasError(true);
        setImageSrc(fallbackUrl);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleLoad = () => {
    // Reset loading state when image loads successfully
    setIsLoading(false);

    // Don't cache or log success for fallback images
    const isFallbackImage =
      imageSrc.includes("/assets/matchdetaillogo/fallback.png") ||
      imageSrc.includes("/assets/fallback-logo.svg") ||
      imageSrc.includes("fallback") ||
      imageSrc.includes("placeholder");

    if (isFallbackImage) {
      console.log(
        `⚠️ [LazyImage] Fallback image loaded, not caching: ${imageSrc}`,
      );
      setHasError(false);
      onLoad?.();
      return;
    }

    // Check for local asset success
    const isLocalAsset =
      imageSrc.includes("/assets/matchdetaillogo/cotif tournament.png") ||
      imageSrc.includes("/assets/matchdetaillogo/valencia.png") ||
      imageSrc.includes("/assets/matchdetaillogo/alboraya.png");

    if (isLocalAsset) {
      console.log(`✅ [LazyImage] Local asset loaded successfully: ${imageSrc}`);
      setHasError(false);
      onLoad?.();
      return;
    }

    // Special logging for Valencia/Spain flags (only for real logos)
    const isSpainFlag =
      imageSrc.includes("/es.svg") ||
      imageSrc.includes("/es.png") ||
      (alt && alt.toLowerCase().includes("spain")) ||
      (alt && alt.toLowerCase().includes("valencia"));

    if (isSpainFlag) {
      console.log(`🇪🇸 [LazyImage] VALENCIA/SPAIN FLAG SUCCESS (REAL LOGO):`, {
        imageSrc,
        alt,
        retryCount,
        wasError: hasError,
        component: "LazyImage",
      });
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

    // Cache successful logo loads
    if (!isFallbackImage && !hasError) {
      // Store in browser cache for immediate future use
      try {
        const cacheKey = `logo_${imageSrc.replace(/[^a-zA-Z0-9]/g, '_')}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          url: imageSrc,
          timestamp: Date.now(),
          alt: alt,
          verified: true // Mark as verified successful load
        }));
        console.log(`💾 [LazyImage] Cached verified successful logo: ${imageSrc}`);
      } catch (error) {
        // Ignore storage errors
      }
    }

    setHasError(false);
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
            display: 'block',
            opacity: 1,
            filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
            ...(style?.width || style?.height ? {} : {
             width: style?.width || style?.height || (isMobile ? '32px' : '32px'),
              height: style?.height || style?.width || (isMobile ? '32px' : '32px')
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
      className={className}
      style={{
        ...style,
        border: 'none',
        outline: 'none',
        display: hasError && imageSrc !== fallbackUrl ? 'none' : 'block',
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
        // Apply size from props if no explicit width/height in style
        ...(style?.width || style?.height ? {} : {
         width: style?.width || style?.height || (isMobile ? '32px' : '32px'),
          height: style?.height || style?.width || (isMobile ? '32px' : '32px')
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