import React, { useState, useEffect, useRef } from "react";
import MyWorldTeamLogo from "./MyWorldTeamLogo";

// Helper function to detect dark mode
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    // Check for Redux store dark mode state
    try {
      // Check if document has dark class (applied by your theme toggle)
      if (document.documentElement.classList.contains('dark')) {
        return true;
      }
      
      // Check for data-theme attribute
      const dataTheme = document.documentElement.getAttribute('data-theme');
      if (dataTheme === 'dark') {
        return true;
      }
      
      // Check localStorage theme setting
      const localTheme = localStorage.getItem('theme');
      if (localTheme === 'dark') {
        return true;
      }
      
      // Check if body has dark mode classes
      if (document.body.classList.contains('dark') || document.body.classList.contains('dark-mode')) {
        return true;
      }
      
      // Check for CSS variables or computed styles that indicate dark mode
      const computedStyle = window.getComputedStyle(document.documentElement);
      const bgColor = computedStyle.getPropertyValue('background-color');
      
      // If background is very dark, assume dark mode
      if (bgColor) {
        const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
          if (brightness < 128) {
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('Error detecting dark mode:', error);
    }
    
    // Fallback to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

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
  leagueContext,
  priority = 'low',
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [themeDetector, setThemeDetector] = useState<number>(0);

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeDetector(prev => prev + 1); // Force re-render
    };

    // Listen for changes to the document class list (theme changes)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    // Also listen for localStorage changes
    window.addEventListener('storage', handleThemeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    // Check for specific teams/leagues that should use local assets immediately
    const shouldUseLocalAsset = () => {
      if (alt) {
        const altLower = alt.toLowerCase();

        // Champions League only - use theme-appropriate logo
        if (altLower.includes("champions league")) {
          const championsLogo = isDarkMode() ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png";
          console.log(`🏆 [LazyImage] Using local Champions League logo (${isDarkMode() ? 'dark' : 'light'} mode) from start: ${championsLogo}`);
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
  }, [src, alt, themeDetector]); // Add themeDetector to trigger re-evaluation when theme changes

  const handleError = () => {
    // Safety check to prevent cascading errors
    try {
      // Immediately set loading to false to prevent broken image display
      setIsLoading(false);

      // Check for specific teams/leagues that should use local assets
      const shouldUseLocalAsset = () => {
        if (alt) {
          const altLower = alt.toLowerCase();

          // Champions League only - use theme-appropriate logo
          if (altLower.includes("champions league")) {
            const championsLogo = isDarkMode() ? "/assets/matchdetaillogo/uefa-white.png" : "/assets/matchdetaillogo/uefa.png";
            setImageSrc(championsLogo);
            setHasError(false);
            setIsLoading(true);
            console.log(`🏆 [LazyImage] Using local Champions League logo (${isDarkMode() ? 'dark' : 'light'} mode): ${championsLogo}`);
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

      if (!hasError && retryCount < 3) {
        console.warn(
          `🖼️ [LazyImage] Failed to load image: ${imageSrc}, retry ${retryCount + 1}`,
        );

        // Add cache busting parameter to force fresh fetch
        const cacheBuster = `?t=${Date.now()}`;

        // League logo fallback strategy (like MyNewLeague2)
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
            // Try server proxy endpoint first
            const fallbackUrl = `/api/league-logo/${leagueId}${cacheBuster}`;
            console.log(
              `🔄 [LazyImage] Trying league logo server proxy: ${fallbackUrl}`,
            );
            setImageSrc(fallbackUrl);
            setRetryCount(retryCount + 1);
            setIsLoading(true);
            return;
          }
        }

        // Second retry: Try square endpoint if not already tried
        if (isLeagueLogo && retryCount === 1) {
          let leagueId = null;

          const apiMatch = imageSrc.match(
            /\/api\/league-logo\/(?:square\/)?(\d+)/,
          );
          if (apiMatch) {
            leagueId = apiMatch[1];
            const squareUrl = `/api/league-logo/square/${leagueId}${cacheBuster}`;
            console.log(
              `🔄 [LazyImage] Trying square league logo endpoint: ${squareUrl}`,
            );
            setImageSrc(squareUrl);
            setRetryCount(retryCount + 1);
            setIsLoading(true);
            return;
          }
        }

        // Third retry: Try direct API-Sports URL
        if (isLeagueLogo && retryCount === 2) {
          let leagueId = null;

          const apiMatch = imageSrc.match(
            /\/api\/league-logo\/(?:square\/)?(\d+)/,
          );
          if (apiMatch) {
            leagueId = apiMatch[1];
            const directUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png${cacheBuster}`;
            console.log(
              `🔄 [LazyImage] Trying direct API-Sports URL: ${directUrl}`,
            );
            setImageSrc(directUrl);
            setRetryCount(retryCount + 1);
            setIsLoading(true);
            return;
          }
        }

        // General retry with cache buster for non-league logos
        if (
          !isLeagueLogo &&
          !imageSrc.includes("?") &&
          !imageSrc.includes("t=")
        ) {
          const freshUrl = imageSrc + cacheBuster;
          console.log(`🔄 [LazyImage] Retrying with cache buster: ${freshUrl}`);
          setImageSrc(freshUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }

        // Final fallback after all retries (increased limit for league logos)
        const maxRetries = isLeagueLogo ? 3 : 2;
        if (retryCount >= maxRetries) {
          console.warn(
            `🚫 [LazyImage] All retries failed for: ${src} (${retryCount + 1} attempts), using fallback`,
          );
          setHasError(true);
          setImageSrc("/assets/matchdetaillogo/fallback.png");
          onError?.();
        } else {
          setRetryCount(retryCount + 1);
        }
      }
    } catch (error) {
      console.warn("⚠️ [LazyImage] Error in handleError function:", error);
      setHasError(true);
      setImageSrc("/assets/matchdetaillogo/fallback.png");
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

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        border: 'none',
        outline: 'none',
        display: hasError && imageSrc !== "/assets/matchdetaillogo/fallback.png" ? 'none' : 'block',
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 1px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 0 1px rgba(255, 255, 255, 0.6))',
        // Apply size from props if no explicit width/height in style
        ...(style?.width || style?.height ? {} : {
          width: style?.width || style?.height || '32px',
          height: style?.height || style?.width || '32px'
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