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
  
  // Preload image if it's high priority
  useEffect(() => {
    if (shouldPreload && src && !src.includes('fallback')) {
      const img = new Image();
      img.src = src;
    }
  }, [src, shouldPreload]);

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
      console.log(`🚫 [LazyImage] Image failed to load:`, {
        src: imageSrc,
        alt: alt,
        originalSrc: src,
        retryCount,
        timestamp: new Date().toISOString()
      });

      // Prevent infinite loops
      if (retryCount >= 3) {
        console.warn(`🚫 [LazyImage] Max retries reached for: ${src}, using fallback`);
        setHasError(true);
        setImageSrc(fallbackUrl);
        setIsLoading(false);
        onError?.();
        return;
      }

      // Check for specific teams/leagues that should use local assets
      if (alt) {
        const altLower = alt.toLowerCase();

        // Champions League - use theme-appropriate logo
        if (altLower.includes("champions league")) {
          const championsLogo = darkMode ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png";
          setImageSrc(championsLogo);
          setHasError(false);
          setIsLoading(false);
          console.log(`🏆 [LazyImage] Using local Champions League logo: ${championsLogo}`);
          return;
        }

        // COTIF Tournament league
        if (altLower.includes("cotif")) {
          setImageSrc("/assets/matchdetaillogo/cotif tournament.png");
          setHasError(false);
          setIsLoading(false);
          console.log(`🏆 [LazyImage] Using local COTIF Tournament logo`);
          return;
        }

        // Valencia team
        if (altLower.includes("valencia") && !altLower.includes("rayo vallecano")) {
          setImageSrc("/assets/matchdetaillogo/valencia.png");
          setHasError(false);
          setIsLoading(false);
          console.log(`⚽ [LazyImage] Using local Valencia logo`);
          return;
        }

        // Alboraya team
        if (altLower.includes("alboraya") || altLower.includes("albaroya")) {
          setImageSrc("/assets/matchdetaillogo/alboraya.png");
          setHasError(false);
          setIsLoading(false);
          console.log(`⚽ [LazyImage] Using local Alboraya logo`);
          return;
        }
      }

      // Try teamLogo as fallback if available
      if (teamLogo && !imageSrc.includes(teamLogo) && retryCount === 0) {
        console.log(`🔄 [LazyImage] Trying teamLogo fallback: ${teamLogo}`);
        setImageSrc(teamLogo);
        setRetryCount(retryCount + 1);
        setIsLoading(false);
        return;
      }

      // Standard retry with cache-busting
      if (retryCount < 2 && !imageSrc.includes('fallback')) {
        console.log(`🔄 [LazyImage] Retrying with cache-busting (attempt ${retryCount + 1})`);
        setImageSrc(`${src}?retry=${retryCount + 1}&t=${Date.now()}`);
        setRetryCount(retryCount + 1);
        setIsLoading(false);
        return;
      }

      // Final fallback
      console.warn(`🚫 [LazyImage] Using final fallback for: ${src}`);
      setHasError(true);
      setImageSrc(fallbackUrl);
      setIsLoading(false);
      onError?.();

    } catch (error) {
      console.warn("⚠️ [LazyImage] Error in handleError:", error);
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
        teamLogo={imageSrc}
        alt={alt}
        size={style?.width || style?.height || "32px"}
        className={className}
        leagueContext={leagueContext}
      />
    );
  }

  // Enhanced player image detection and prevention - but more conservative for team logos
  if (alt && imageSrc) {
    // Only block clear player photo patterns, not team logos
    const isDefinitePlayerPhoto = (
      imageSrc.includes('/players/') && !imageSrc.includes('/teams/') && !imageSrc.includes('/leagues/')
    ) || (
      imageSrc.includes('Athletes/') && !alt.toLowerCase().includes('team') && !alt.toLowerCase().includes('logo')
    ) || (
      imageSrc.includes('playerheadshots') || imageSrc.includes('playerimages') || imageSrc.includes('mugshots')
    );
    
    // Only block in very specific team contexts to avoid false positives
    const isStrictTeamContext = (
      alt.toLowerCase().includes('team logo') || 
      alt.toLowerCase().includes('club logo') ||
      className?.includes('team-logo') ||
      className?.includes('club-logo')
    );
    
    if (isDefinitePlayerPhoto && isStrictTeamContext) {
      console.warn(`🚨 [LazyImage] Definite player photo blocked in team logo context:`, {
        alt,
        imageSrc,
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
      title={title}
      className={className}
      style={{
        ...style,
        border: 'none',
        outline: 'none',
        display: 'block',
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.6))',
        // Apply default size if not specified
        width: style?.width || (isMobile ? '32px' : '32px'),
        height: style?.height || (isMobile ? '32px' : '32px'),
        objectFit: 'contain'
      }}
      loading={shouldPreload ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;