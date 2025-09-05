import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { getTeamLogoSources, TeamData } from '@/lib/teamLogoSources';
import MyWorldTeamLogo from "./MyWorldTeamLogo";
import MyCircularFlag from "./MyCircularFlag";




interface LazyImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: (e?: React.SyntheticEvent<HTMLImageElement>) => void; // Adjusted to accept event
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

// Define constants used in the updated handleImageError if they are not globally available
const MAX_LOAD_ATTEMPTS = 3; // Example value, adjust as needed

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
  const [currentSrc, setCurrentSrc] = useState<string>(src); // Renamed to match handler
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [loadAttempt, setLoadAttempt] = useState<number>(0); // Renamed from retryCount to match handler
  const [fallbackAttempted, setFallbackAttempted] = useState<boolean>(false);

  // State to manage the overall image status (useful for MyWorldTeamLogo)
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');


  // Get dark mode state from Redux store
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Get device info for responsive sizing
  const { isMobile } = useDeviceInfo();

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  // Keep track of the original src to use in error handling
  const originalSrc = useRef<string>(src);

  // Effect to update the image source when the original src prop changes
  useEffect(() => {
    originalSrc.current = src; // Store the original src
    setCurrentSrc(src);
    setImageLoaded(false);
    setImageError(false);
    setLoadAttempt(0); // Reset attempt count
    setFallbackAttempted(false);
    setImageState('loading');

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
      setCurrentSrc(localAssetUrl);
      setImageError(false);
      setLoadAttempt(0);
      setImageState('loaded'); // Assume local assets load successfully
    } else {
      setCurrentSrc(src);
      setImageError(false);
      setLoadAttempt(0);
    }
  }, [src, alt, darkMode]); // Add darkMode to trigger re-evaluation when theme changes

  // Handler for image load errors
  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;

    console.warn(`⚠️ [LazyImage] Image error for src: ${target.src}`, {
      teamId: teamId,
      teamName: teamName,
      leagueContext: leagueContext,
      useTeamLogo: useTeamLogo,
      currentAttempt: loadAttempt + 1,
      maxAttempts: MAX_LOAD_ATTEMPTS,
      isServerProxy: target.src.includes('/api/team-logo/'),
      originalSrc: originalSrc.current // Use ref for original source
    });

    // Avoid infinite retry loops
    if (loadAttempt >= MAX_LOAD_ATTEMPTS) {
      console.error(`🚫 [LazyImage] Max retry attempts reached for: ${target.src}`);

      // Set final fallback image
      if (!target.src.includes('fallback.png') && !target.src.includes('fallback-logo.png')) {
        setCurrentSrc('/assets/matchdetaillogo/fallback.png');
        setImageState('error');
      }
      return;
    }

    setLoadAttempt(prev => prev + 1);

    // Enhanced fallback logic for team logos (works for both useTeamLogo=true and false)
    if ((useTeamLogo || (!useTeamLogo && teamId && teamName)) && teamId && teamName) {
      // Check if this might be a national team that should use flag
      const nationalTeamNames = [
        'Malaysia', 'Singapore', 'Saudi Arabia', 'FYR Macedonia', 'North Macedonia', 'Macedonia',
        'United Arab Emirates', 'UAE', 'Syria', 'Finland', 'San Marino',
        'Belarus', 'Belgium', 'Iraq', 'Pakistan', 'Australia', 'Yemen',
        'Lebanon', 'Kuwait', 'Myanmar', 'Uzbekistan', 'Sri Lanka', 'Vietnam',
        'Bangladesh', 'Afghanistan', 'India', 'Iran', 'Japan', 'Thailand'
      ];

      // A more robust check for national teams, considering variations and country codes if available
      const isNationalTeam = nationalTeamNames.some(country =>
        teamName.includes(country) || teamName.replace(/\s*(U21|U20|U19|U18|U17)\s*/gi, '').trim() === country
      );

      // Try different logo sources progressively for club teams
      if (!target.src.includes('/api/team-logo/') && !target.src.includes('api/team-logo')) { // Added common variations
        // Try server proxy endpoint first
        const serverProxyUrl = `/api/team-logo/square/${teamId}?size=64`;
        console.log(`🔄 [LazyImage] Trying server proxy: ${serverProxyUrl}`);
        setCurrentSrc(serverProxyUrl);
        return;
      }

      // If server proxy also fails, try alternative size
      if (target.src.includes('size=64')) {
        const smallerUrl = `/api/team-logo/square/${teamId}?size=32`;
        console.log(`🔄 [LazyImage] Trying smaller size: ${smallerUrl}`);
        setCurrentSrc(smallerUrl);
        return;
      }

      // Try team logo sources fallback from getTeamLogoSources
      if (teamId && teamName) {
        const sources = getTeamLogoSources({ id: teamId, name: teamName });
        const nextSource = sources.find(source =>
          source.url !== target.src &&
          !source.url.includes('/api/team-logo/') &&
          !source.url.includes('api/team-logo')
        );

        if (nextSource) {
          console.log(`🔄 [LazyImage] Trying next source: ${nextSource.source} - ${nextSource.url}`);
          setCurrentSrc(nextSource.url);
          return;
        }
      }
    }

    // Standard error handling for non-team logos or when team-specific fallbacks are exhausted
    if (fallbackSrc && !target.src.includes(fallbackSrc) && !fallbackAttempted) {
      console.log(`🔄 [LazyImage] Using provided fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setFallbackAttempted(true);
      return;
    }

    if (onError) {
      onError(e);
    } else {
      // Use fallback image as a last resort
      console.log(`🔄 [LazyImage] Using default fallback image`);
      // Ensure not to override with fallback if it's already the fallback
      if (!target.src.includes('fallback.png') && !target.src.includes('fallback-logo.png')) {
        setCurrentSrc('/assets/matchdetaillogo/fallback.png');
      }
      setImageState('error');
    }
  }, [teamId, teamName, leagueContext, useTeamLogo, loadAttempt, onError, originalSrc]);


  // Handler for successful image load
  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false); // Ensure error state is reset on successful load
    setImageState('loaded');

    // Don't cache or log success for fallback images
    const isFallbackImage =
      currentSrc.includes("/assets/fallback-logo.png") ||
      currentSrc.includes("/assets/fallback-logo.svg") ||
      currentSrc.includes("fallback.png") || // Added more general fallback check
      currentSrc.includes("fallback-logo.png") || // Added more specific fallback check
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
      currentSrc.includes("/assets/matchdetaillogo/alboraya.png") ||
      currentSrc.includes("/assets/matchdetaillogo/uefa-white.png") ||
      currentSrc.includes("/assets/matchdetaillogo/uefa.png");

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
      (alt && alt.toLowerCase().includes("valencia") && !alt.toLowerCase().includes("u20") && !alt.toLowerCase().includes("u21")); // More specific check for Valencia flag

    if (isSpainFlag) {
      console.log(`🇪🇸 [LazyImage] VALENCIA/SPAIN FLAG SUCCESS (REAL LOGO):`, {
        currentSrc,
        alt,
        retryCount: loadAttempt, // Use loadAttempt here
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
          retryCount: loadAttempt, // Use loadAttempt here
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
  }, [currentSrc, alt, loadAttempt, imageError, onLoad, teamName, teamId]); // Add teamName and teamId for completeness


  // LazyImage should NOT make team type decisions - that's MyWorldTeamLogo's job
  // Remove the Friendlies Clubs detection logic as it bypasses MyWorldTeamLogo
  console.log(`🔍 [LazyImage] League context:`, {
    leagueContextName: leagueContext?.name,
    leagueContextCountry: leagueContext?.country,
    teamName: teamName,
    useTeamLogo: useTeamLogo
  });

  // Use MyWorldTeamLogo only if explicitly requested with useTeamLogo=true
  if (useTeamLogo && teamId && teamName) {
    // Pass the currentSrc to MyWorldTeamLogo, it will handle its own loading/fallback
    return (
      <MyWorldTeamLogo
        teamName={teamName}
        teamId={teamId}
        teamLogo={currentSrc} // Pass currentSrc as potential logo
        alt={alt}
        size={style?.width || style?.height || "32px"}
        className={className}
        leagueContext={leagueContext}
        imageState={imageState} // Pass image state
      />
    );
  }

  // When useTeamLogo=false, LazyImage should ONLY handle image loading, not team decisions
  // MyWorldTeamLogo has already made the decision about team type and logo handling
  console.log(`🖼️ [LazyImage] Pure image loading mode (useTeamLogo=false) for: ${teamName || 'unknown'}`);
  
  // Only minimal fallback handling when explicitly requested and image fails
  if (!useTeamLogo && teamId && teamName && imageError && !currentSrc.includes('/api/team-logo/')) {
    console.log(`🔄 [LazyImage] Image failed, trying server proxy as fallback for ${teamName}`);
    const serverProxyUrl = `/api/team-logo/square/${teamId}?size=64`;
    setCurrentSrc(serverProxyUrl);
    setImageLoaded(false);
    setImageError(false);
    setImageState('loading');
    return;
  }

  // Special handling for national teams that should use flags directly via MyWorldTeamLogo
  // This block is now implicitly handled by the `useTeamLogo` check above,
  // as the `nationalTeamNames` logic inside `handleError` leads to `useTeamLogo` being true
  // and `MyWorldTeamLogo` being rendered. If `useTeamLogo` is false but it's a national team,
  // it needs to be explicitly handled here or `useTeamLogo` should be set to true.
  // For now, relying on `useTeamLogo` being true for national teams to trigger MyWorldTeamLogo.

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        border: 'none',
        outline: 'none',
        // Hide image if there's an error AND it's not the final fallback image
        display: imageError && (currentSrc.includes('fallback.png') || currentSrc.includes('fallback-logo.png')) ? 'none' : 'block',
        opacity: imageLoaded ? 2 : 1.95,
        transition: 'opacity 0.05s ease-in-out',
        // Add theme-aware shadows for better contrast and visibility (lg shadow)
        filter: darkMode 
          ? 'drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))' 
          : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 10px rgba(0, 0, 0, 0.65))',
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