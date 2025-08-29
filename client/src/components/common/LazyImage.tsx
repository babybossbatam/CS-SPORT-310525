import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";
import MyWorldTeamLogo from "./MyWorldTeamLogo";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  loading?: 'lazy' | 'eager';
  priority?: 'low' | 'high';
  placeholder?: string;
  fallbackSrc?: string;
  maxRetries?: number;
  retryDelay?: number;
  useTeamLogo?: boolean;
  teamId?: number | string;
  teamName?: string;
  leagueContext?: {
    name?: string;
    country?: string;
  };
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  style,
  onLoad,
  onError,
  loading = "lazy",
  priority = "low",
  placeholder,
  fallbackSrc = "/assets/fallback.png",
  maxRetries = 2,
  retryDelay = 1000,
  useTeamLogo = false,
  teamId,
  teamName,
  leagueContext
}) => {
  // Note: For team logos, consider using MyWorldTeamLogo instead of LazyImage
  // LazyImage is better suited for general images, league logos, and non-team assets
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Enhanced team logo URL resolution
  const resolvedSrc = useMemo(() => {
    if (useTeamLogo && teamId && teamName) {
      // Use team-specific API endpoint for better logo resolution
      return `/api/team-logo/square/${teamId}?size=64&name=${encodeURIComponent(teamName)}`;
    }
    return src;
  }, [useTeamLogo, teamId, teamName, src]);


  // Get dark mode state from Redux store
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Get device info for responsive sizing
  const { isMobile } = useDeviceInfo();

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  // Preload image if it's high priority
  useEffect(() => {
    if (shouldPreload && src && !src.includes('fallback')) {
      const img = new Image();
      img.src = src;
    }
  }, [src, shouldPreload]);

  // Update image source initialization to use resolved source
  useEffect(() => {
    setImageSrc(resolvedSrc);
    setImageError(false);
    setIsLoading(false);
    setRetryCount(0);
  }, [resolvedSrc]);


  const fallbackUrl = "/assets/matchdetaillogo/fallback.png";

  useEffect(() => {
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

      // Immediately set loading to false to prevent broken image display
      setIsLoading(false);

      // Check if this is already a fallback URL to prevent infinite loops
      if (imageSrc.includes('fallback.png') || imageSrc.includes('fallback-logo')) {
        console.log(`🚫 [LazyImage] Already using fallback URL, stopping retries`);
        setHasError(true);
        return;
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
        }
        return false;
      };

      const localAssetUsed = shouldUseLocalAsset();
      if (localAssetUsed) return;

      // For team logos, limit retries and use direct fallback
      const isTeamLogo = imageSrc.includes('/api/team-logo/') ||
                        imageSrc.includes('media.api-sports.io/football/teams/') ||
                        (alt && (alt.toLowerCase().includes('logo') || alt.toLowerCase().includes('team')));

      if (isTeamLogo && retryCount === 0) {
        // Try teamLogo prop as first fallback for team logos
        if (teamLogo && !imageSrc.includes(teamLogo)) {
          console.log(`🔄 [LazyImage] Trying teamLogo fallback: ${teamLogo}`);
          setImageSrc(teamLogo);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }
      }

      // Enhanced league logo handling
      const isLeagueLogo =
        imageSrc.includes("/api/league-logo/") ||
        imageSrc.includes("media.api-sports.io/football/leagues/") ||
        imageSrc.includes("imagecache.365scores.com");

      if (isLeagueLogo && retryCount < 2) {
        // Extract league ID for better debugging
        let leagueId = "unknown";
        const apiMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
        const mediaMatch = imageSrc.match(/media\.api-sports\.io\/football\/leagues\/(\d+)/);
        const scoresMatch = imageSrc.match(/Competitions\/(\d+)/);

        if (apiMatch) leagueId = apiMatch[1];
        else if (mediaMatch) leagueId = mediaMatch[1];
        else if (scoresMatch) leagueId = scoresMatch[1];

        console.log(`🏆 [LazyImage] League logo error for: ${alt} (ID: ${leagueId}), attempt ${retryCount + 1}`);

        if (retryCount === 0 && leagueId !== "unknown") {
          // Try direct API-Sports URL first
          const directApiUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
          console.log(`🏆 [LazyImage] League logo fallback: trying direct API-Sports for ${leagueId}`);
          setImageSrc(directApiUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }
      }

      // Final fallback after all retries
      if (retryCount >= maxRetries || (!isTeamLogo && !isLeagueLogo)) {
        console.warn(`🚫 [LazyImage] Using fallback for: ${alt} after ${retryCount + 1} attempts`);
        setHasError(true);
        setImageSrc(fallbackUrl);
        onError?.();
        return;
      }

      // Standard retry for other cases
      if (retryCount < maxRetries - 1) {
        console.warn(`🖼️ [LazyImage] Retrying image load: ${imageSrc} (attempt ${retryCount + 1})`);
        setRetryCount(retryCount + 1);
        setIsLoading(true);
        return;
      }

      // Final fallback
      setHasError(true);
      setImageSrc(fallbackUrl);
      onError?.();

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

    // Only cache real, non-fallback images
    console.log(
      `💾 [LazyImage] Real logo loaded and ready for caching: ${imageSrc}`,
    );
    setHasError(false);
    onLoad?.();
  };



  // Use MyWorldTeamLogo if team information is provided and useTeamLogo is true
  if (useTeamLogo && teamId && teamName) {
    return (
      <MyWorldTeamLogo
        teamName={teamName}
        teamId={teamId}
        teamLogo={imageSrc} // Use imageSrc here as it's the one being potentially loaded or fallback
        alt={alt}
        size={style?.width || style?.height || "32px"}
        className={className}
        leagueContext={leagueContext}
      />
    );
  }

  // Enhanced player image detection and prevention - ONLY for actual player photos
  if (alt && imageSrc) {
    // More precise player photo URL patterns - exclude team logo URLs
    const isPlayerPhoto = (
      // Only block if it's clearly a player photo AND not a team/logo context
      (imageSrc.includes('/players/') && !imageSrc.includes('/teams/') && !imageSrc.includes('/team-logo/')) ||
      (imageSrc.includes('Athletes/') && !imageSrc.includes('Competitors/') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('player-') && !imageSrc.includes('team-') && !imageSrc.includes('logo')) ||
      (imageSrc.includes('/headshots/') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('_headshot') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('player_') && !imageSrc.includes('team_') && !imageSrc.includes('logo')) ||
      (imageSrc.includes('/athlete/') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('/persons/') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('/portraits/') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('playerheadshots') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('playerimages') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team')) ||
      (imageSrc.includes('mugshots') && !alt.toLowerCase().includes('logo') && !alt.toLowerCase().includes('team'))
    ) &&
    // ONLY block if alt text clearly indicates it's a player, not a team
    (alt.toLowerCase().includes('player') || alt.toLowerCase().includes('headshot') || alt.toLowerCase().includes('portrait')) &&
    // NEVER block if it's clearly team/logo context
    !alt.toLowerCase().includes('logo') &&
    !alt.toLowerCase().includes('team') &&
    !alt.toLowerCase().includes('vs') &&
    !alt.toLowerCase().includes('club') &&
    !imageSrc.includes('/team-logo/') &&
    !imageSrc.includes('/teams/') &&
    !imageSrc.includes('Competitors/');

    // Only check team context if we detected a potential player photo
    if (isPlayerPhoto) {
      const isTeamContext = alt.toLowerCase().includes('vs') ||
                           alt.toLowerCase().includes('team') ||
                           alt.toLowerCase().includes('logo') ||
                           alt.toLowerCase().includes('home') ||
                           alt.toLowerCase().includes('away') ||
                           alt.toLowerCase().includes('club') ||
                           className?.includes('team') ||
                           className?.includes('logo');

      // Additional check: if the image dimensions suggest it's a small logo/icon
      const isLogoSize = (style?.width && parseInt(style.width as string) <= 64) ||
                        (style?.height && parseInt(style.height as string) <= 64) ||
                        className?.includes('w-6') || className?.includes('h-6') ||
                        className?.includes('w-8') || className?.includes('h-8');

      if (isTeamContext || isLogoSize) {
        console.warn(`🚨 [LazyImage] Player photo blocked in team/logo context:`, {
          alt,
          imageSrc,
          originalSrc: src,
          isTeamContext,
          isLogoSize,
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
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.15s ease-in-out',
        filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
        // Apply size from props if no explicit width/height in style
        ...(style?.width || style?.height ? {} : {
         width: style?.width || style?.height || (isMobile ? '32px' : '32px'),
          height: style?.height || style?.width || (isMobile ? '32px' : '32px')
        })
      }}
      loading={shouldPreload ? 'eager' : 'lazy'}
      decoding={shouldPreload ? 'sync' : 'async'}
      fetchPriority={shouldPreload ? 'high' : 'auto'}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;