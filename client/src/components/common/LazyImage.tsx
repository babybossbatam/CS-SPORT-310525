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

      if (isNationalTeam && !target.src.includes('flagsapi.com') && !target.src.includes('countryflags.io') && useTeamLogo) {
        // For national teams, if the current src is not a flag, try to render MyWorldTeamLogo which handles flags
        console.log(`🏳️ [LazyImage] National team detected: ${teamName}. Will attempt to use MyWorldTeamLogo for flag.`);
        // Setting a generic fallback for the img tag itself, MyWorldTeamLogo will be rendered in the JSX
        setCurrentSrc('/assets/matchdetaillogo/fallback.png');
        setImageState('error'); // Mark as error so MyWorldTeamLogo gets a chance
        return;
      }

      // Try different logo sources progressively for club teams or national teams if flag attempt fails
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


  // Special handling for league 667 (Friendlies Clubs) - detect national teams and use MyCircularFlag
  // Check if this is from league 667 using leagueContext.name since leagueId doesn't exist in leagueContext
  const isFriendliesClubs = leagueContext?.name?.toLowerCase().includes('friendlies') && 
                           leagueContext?.country?.toLowerCase() === 'world';
  
  console.log(`🔍 [LazyImage] Checking league context:`, {
    leagueContextName: leagueContext?.name,
    leagueContextCountry: leagueContext?.country,
    teamName: teamName,
    isFriendliesClubs: isFriendliesClubs
  });

  if (isFriendliesClubs && teamName) {
    // List of common national team names for Friendlies Clubs league
    const nationalTeamNames = [
      'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 
      'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 
      'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Cambodia', 
      'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic', 
      'Denmark', 'Ecuador', 'Egypt', 'England', 'Estonia', 'Finland', 'France', 
      'Georgia', 'Germany', 'Ghana', 'Greece', 'Hong Kong', 'Hungary', 'Iceland', 
      'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 
      'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Latvia', 
      'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Moldova', 
      'Montenegro', 'Morocco', 'Myanmar', 'Netherlands', 'New Zealand', 'Nigeria', 
      'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Peru', 
      'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 
      'Saudi Arabia', 'Scotland', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 
      'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Syria', 
      'Tajikistan', 'Thailand', 'Tunisia', 'Turkey', 'Turkmenistan', 'Ukraine', 
      'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 
      'Wales', 'Yemen'
    ];

    // Improved national team detection - exact match or team name is exactly a country name
    const isNationalTeam = nationalTeamNames.some(country => {
      const teamNameLower = teamName.toLowerCase().trim();
      const countryLower = country.toLowerCase();
      
      // Exact match or team name equals country name
      return teamNameLower === countryLower || 
             teamNameLower.includes(countryLower) ||
             countryLower.includes(teamNameLower);
    });

    if (isNationalTeam) {
      console.log(`🏆 [LazyImage] Friendlies Clubs national team detected: ${teamName}, using MyCircularFlag`);
      return (
        <MyCircularFlag
          teamName={teamName}
          teamId={teamId}
          fallbackUrl={currentSrc}
          alt={alt}
          size={style?.width || style?.height || "32px"}
          className={className}
          countryName={teamName}
        />
      );
    } else {
      console.log(`⚽ [LazyImage] Friendlies Clubs club team detected: ${teamName}, continuing with LazyImage`);
      // Continue with regular LazyImage logic for club teams
    }
  }

  // Use MyWorldTeamLogo if team information is provided and useTeamLogo is true
  // Also render MyWorldTeamLogo if it's a detected national team, even if useTeamLogo is false
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
        onLoad={onLoad} // Pass down load handler
        onError={onError} // Pass down error handler
        imageState={imageState} // Pass image state
      />
    );
  }

  // Enhanced team logo handling when useTeamLogo is false but we have team info
  // This handles cases where MyWorldTeamLogo calls LazyImage with useTeamLogo=false
  if (!useTeamLogo && teamId && teamName && !currentSrc.includes('fallback.png')) {
    console.log(`🔍 [LazyImage] Enhanced handling for club team: ${teamName} (ID: ${teamId}), current src: ${currentSrc}`);
    
    // Check if current src is still the original and not a proper team logo URL
    const isOriginalSrc = currentSrc === src;
    const isProperTeamLogoUrl = currentSrc.includes('/api/team-logo/') || 
                               currentSrc.includes('api/team-logo') ||
                               currentSrc.includes('media.api-sports.io/football/teams/');
    
    // If we have original src and it's not a proper team logo URL, get better sources
    if (isOriginalSrc && !isProperTeamLogoUrl) {
      console.log(`🔄 [LazyImage] Original src detected for ${teamName}, trying server proxy first`);
      const serverProxyUrl = `/api/team-logo/square/${teamId}?size=64`;
      setCurrentSrc(serverProxyUrl);
      setImageLoaded(false);
      setImageError(false);
      setImageState('loading');
      return; // Return early to prevent rendering with old src
    }
    
    // Always try server proxy first for club teams when useTeamLogo=false and current src is not team logo
    if (!currentSrc.includes('/api/team-logo/') && !currentSrc.includes('api/team-logo') && !currentSrc.includes('media.api-sports.io/football/teams/')) {
      const serverProxyUrl = `/api/team-logo/square/${teamId}?size=64`;
      console.log(`🔄 [LazyImage] Trying server proxy for club team ${teamName}: ${serverProxyUrl}`);
      setCurrentSrc(serverProxyUrl);
      setImageLoaded(false);
      setImageError(false);
      setImageState('loading');
      return; // Return early to prevent rendering with old src
    }
    
    // If server proxy is already being used but not loaded/errored, let it continue
    if (currentSrc.includes('/api/team-logo/') && !imageLoaded && !imageError && imageState === 'loading') {
      console.log(`⏳ [LazyImage] Server proxy loading for ${teamName}: ${currentSrc}`);
      // Let it continue loading
    }
    
    // Check if we need better logo sources for this team (fallback option)
    if (imageError || (imageLoaded && currentSrc.includes('fallback'))) {
      const logoSources = getTeamLogoSources({ id: teamId, name: teamName });
      
      if (logoSources.length > 0) {
        const bestSource = logoSources.find(source => 
          source.url !== currentSrc && 
          !source.url.includes('/api/team-logo/') &&
          !source.url.includes('fallback')
        );
        
        if (bestSource) {
          console.log(`🔄 [LazyImage] Using alternative logo source for ${teamName}: ${bestSource.source}`);
          setCurrentSrc(bestSource.url);
          setImageLoaded(false);
          setImageError(false);
          setImageState('loading');
          return;
        }
      }
    }
  }

  // Additional check: if we're still showing a placeholder/empty logo and have team info, try server proxy
  if (!useTeamLogo && teamId && teamName && imageLoaded && !imageError) {
    // Check if the current image looks like a placeholder (often very small or empty)
    const isPotentialPlaceholder = currentSrc.includes('placeholder') || 
                                  currentSrc.includes('fallback') ||
                                  currentSrc === src; // Still showing original potentially bad src
    
    if (isPotentialPlaceholder && !currentSrc.includes('/api/team-logo/')) {
      console.log(`🔄 [LazyImage] Detected potential placeholder for ${teamName}, switching to server proxy`);
      const serverProxyUrl = `/api/team-logo/square/${teamId}?size=64`;
      setCurrentSrc(serverProxyUrl);
      setImageLoaded(false);
      setImageError(false);
      setImageState('loading');
      return;
    }
  }

  // Special handling for national teams that should use flags directly via MyWorldTeamLogo
  // This block is now implicitly handled by the `useTeamLogo` check above,
  // as the `nationalTeamNames` logic inside `handleError` leads to `useTeamLogo` being true
  // and `MyWorldTeamLogo` being rendered. If `useTeamLogo` is false but it's a national team,
  // it needs to be explicitly handled here or `useTeamLogo` should be set to true.
  // For now, relying on `useTeamLogo` being true for national teams to trigger MyWorldTeamLogo.

  // Check if this should be rendered as a circular flag (for national teams)
  const isNationalTeam = teamName && teamName !== "World" && leagueContext?.country?.toLowerCase() === 'world';
  
  if (isNationalTeam) {
    return (
      <MyCircularFlag
        teamName={teamName}
        teamId={teamId}
        fallbackUrl={currentSrc}
        alt={alt}
        size={style?.width || style?.height || (isMobile ? '32px' : '32px')}
        className={className}
        countryName={teamName}
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
        }),
        // Add circular styling for national teams/flags
        borderRadius: (teamName && leagueContext?.country?.toLowerCase() === 'world') || alt?.toLowerCase().includes('flag') ? '50%' : '0',
        objectFit: 'cover',
        // Add circular styling for flags
        borderRadius: teamName && (leagueContext?.country?.toLowerCase() === 'world' || alt?.toLowerCase().includes('flag')) ? '50%' : '0'
      }}
      loading={shouldPreload ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;