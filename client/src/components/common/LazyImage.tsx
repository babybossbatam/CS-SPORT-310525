import React, { useState, useEffect, useRef, useCallback } from "react";
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
  fallbackSrc?: string;
  // Team logo specific props
  useTeamLogo?: boolean;
  teamId?: number | string;
  teamName?: string;
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
  fallbackSrc,
  useTeamLogo = false,
  teamId,
  teamName,
  leagueContext,
  priority = 'low',
}) => {
  // State for the image source, loading, error, and retry count
  const [currentSrc, setSrc] = useState<string>(src);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [fallbackAttempted, setFallbackAttempted] = useState<boolean>(false);

  // Get dark mode state from Redux store
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Get device info for responsive sizing
  const { isMobile } = useDeviceInfo();

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  // Effect to update the image source when the original src prop changes
  useEffect(() => {
    setSrc(src);
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    setFallbackAttempted(false);

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
      setSrc(localAssetUrl);
      setImageError(false);
      setRetryCount(0);
    } else {
      setSrc(src);
      setImageError(false);
      setRetryCount(0);
    }
  }, [src, alt, darkMode]); // Add darkMode to trigger re-evaluation when theme changes

  // Handler for image load errors
  const handleError = useCallback(() => {
    console.warn(`❌ [LazyImage] Image failed to load: ${src}`);
    setImageLoaded(false);
    setImageError(true);

    if (!fallbackAttempted && fallbackSrc && fallbackSrc !== src) {
      console.log(`🔄 [LazyImage] Attempting fallback: ${fallbackSrc}`);
      setFallbackAttempted(true);
      setSrc(fallbackSrc);
      setImageError(false);
    } else {
      console.log(`🔄 [LazyImage] Using default fallback logo`);
      setSrc('/assets/fallback-logo.png');
    }
  }, [src, fallbackSrc, fallbackAttempted]);


  // Handler for successful image load
  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false); // Ensure error state is reset on successful load

    // Don't cache or log success for fallback images
    const isFallbackImage =
      currentSrc.includes("/assets/fallback-logo.png") ||
      currentSrc.includes("/assets/fallback-logo.svg") ||
      currentSrc.includes("fallback") ||
      currentSrc.includes("placeholder");

    if (isFallbackImage) {
      console.log(
        `⚠️ [LazyImage] Fallback image loaded, not caching: ${currentSrc}`,
      );
      onLoad?.();
      return;
    }

    // Check for local asset success
    const isLocalAsset =
      currentSrc.includes("/assets/matchdetaillogo/cotif tournament.png") ||
      currentSrc.includes("/assets/matchdetaillogo/valencia.png") ||
      currentSrc.includes("/assets/matchdetaillogo/alboraya.png");

    if (isLocalAsset) {
      console.log(`✅ [LazyImage] Local asset loaded successfully: ${currentSrc}`);
      onLoad?.();
      return;
    }

    // Special logging for Valencia/Spain flags (only for real logos)
    const isSpainFlag =
      currentSrc.includes("/es.svg") ||
      currentSrc.includes("/es.png") ||
      (alt && alt.toLowerCase().includes("spain")) ||
      (alt && alt.toLowerCase().includes("valencia"));

    if (isSpainFlag) {
      console.log(`🇪🇸 [LazyImage] VALENCIA/SPAIN FLAG SUCCESS (REAL LOGO):`, {
        currentSrc,
        alt,
        retryCount,
        wasError: imageError,
        component: "LazyImage",
      });
    }

    // Enhanced league logo success logging (only for real logos)
    const isLeagueLogo =
      currentSrc.includes("/api/league-logo/") ||
      currentSrc.includes("media.api-sports.io/football/leagues/") ||
      currentSrc.includes("imagecache.365scores.com");

    if (isLeagueLogo) {
      // Extract league ID and source for better tracking
      let leagueId = "unknown";
      let source = "unknown";

      const apiMatch = currentSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
      const mediaMatch = currentSrc.match(
        /media\.api-sports\.io\/football\/leagues\/(\d+)/,
      );
      const scoresMatch = currentSrc.match(/Competitions\/(\d+)/);

      if (apiMatch) {
        leagueId = apiMatch[1];
        source = currentSrc.includes("/square/") ? "api-square" : "api-proxy";
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
          currentSrc,
          retryCount,
          wasError: imageError,
          component: "LazyImage",
        },
      );
    }

    if (imageError) {
      console.log(`✅ [LazyImage] Recovered and loaded real logo: ${currentSrc}`);
    }

    // Only cache real, non-fallback images
    console.log(
      `💾 [LazyImage] Real logo loaded and ready for caching: ${currentSrc}`,
    );
    onLoad?.();
  }, [currentSrc, alt, retryCount, imageError, onLoad]);


  // Use MyWorldTeamLogo if team information is provided and useTeamLogo is true
  if (useTeamLogo && teamId && teamName) {
    return (
      <MyWorldTeamLogo
        teamName={teamName}
        teamId={teamId}
        teamLogo={currentSrc}
        alt={alt}
        size={style?.width || style?.height || "32px"}
        className={className}
        leagueContext={leagueContext}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        border: 'none',
        outline: 'none',
        display: imageError && currentSrc !== "/assets/fallback-logo.png" ? 'none' : 'block',
        opacity: imageLoaded ? 1 : 0.7,
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