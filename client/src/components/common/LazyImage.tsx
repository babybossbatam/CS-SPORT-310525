import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
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
  priority = 'low',
  ...restProps
}) => {
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
    // Reset state when src changes
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setImageSrc(src);

    // Check for specific teams/leagues that should use local assets immediately
      const shouldUseLocalAsset = () => {
        if (alt) {
          const altLower = alt.toLowerCase();

          // Check for common team names that have local assets
          const localAssetTeams = [
            'valencia', 'alboraya', 'cotif tournament', 'uefa',
            'premier league', 'la liga', 'bundesliga', 'serie a',
            'champions league', 'europa league', 'world cup'
          ];

          if (localAssetTeams.some(team => altLower.includes(team))) {
            const localPath = `/assets/matchdetaillogo/${altLower.replace(/\s+/g, '')}.png`;
            setImageSrc(localPath);
            setHasError(false);
            setIsLoading(false);
            return true;
          }
        }
        return false;
      };

      const localAssetUsed = shouldUseLocalAsset();
      if (localAssetUsed) return;
    }, [src, alt, darkMode]); // Add darkMode to trigger re-evaluation when theme changes

    // Extract teamId from src for use throughout component
  const extractedTeamId = (imageSrc.match(/\/team-logo\/(?:square|circular)\/(\d+)/) || [])[1];

  const handleError = () => {
    // Prevent multiple error handling for the same image
    if (hasError) return;

    console.log(`❌ [LazyImage] Image error for: ${alt}`, {
      imageSrc,
      retryCount,
      hasError,
      component: "LazyImage",
    });

    setHasError(true);

    // Team logo specific error handling
    const isTeamLogo =
      imageSrc.includes("/api/team-logo/") ||
      imageSrc.includes("media.api-sports.io/football/teams/") ||
      imageSrc.includes("imagecache.365scores.com");

    if (isTeamLogo) {
      // Extract team ID for better debugging
      let teamId = "unknown";
      const apiMatch = imageSrc.match(/\/api\/team-logo\/(\d+)/);
      const mediaMatch = imageSrc.match(
        /media\.api-sports\.io\/football\/teams\/(\d+)/,
      );
      const scoresMatch = imageSrc.match(/Images\/(\d+)/);

      if (apiMatch) teamId = apiMatch[1];
      else if (mediaMatch) teamId = mediaMatch[1];
      else if (scoresMatch) teamId = scoresMatch[1];

      console.log(
        `⚽ [LazyImage] Team logo error detected for: ${alt} (ID: ${teamId})`,
        {
          imageSrc,
          retryCount,
          hasError,
          teamId,
        },
      );
    }

    // League logo specific error handling
    const isLeagueLogo =
      imageImageSrc.includes("/api/league-logo/") ||
      imageSrc.includes("media.api-sports.io/football/leagues/") ||
      imageSrc.includes("imagecache.365scores.com");

    if (isLeagueLogo) {
      // Extract league ID for better debugging
      let leagueId = "unknown";
      const apiMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
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

    if (retryCount < 2) {
      // Enhanced league logo fallback strategy
      if (isLeagueLogo && retryCount === 0) {
        // Extract league ID from
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

      // Second retry: try 365scores
      if (isLeagueLogo && retryCount === 1) {
        const leagueIdMatch = imageSrc.match(/(?:\/api\/league-logo\/(?:square\/)?|leagues\/|Competitions\/)(\d+)/);
        if (leagueIdMatch) {
          const leagueId = leagueIdMatch[1];
          const scoresUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitions/${leagueId}`;
          console.log(
            `🏆 [LazyImage] League logo second attempt: trying 365scores for ${leagueId}`,
          );
          setImageSrc(scoresUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }
      }

      // Try direct media URL as final attempt
      if (isLeagueLogo && retryCount === 1) {
        const leagueIdMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
        if (leagueIdMatch) {
          const leagueId = leagueIdMatch[1];
          const directMediaUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
          console.log(
            `🏆 [LazyImage] League logo direct media attempt for ${leagueId}`,
          );
          setImageSrc(directMediaUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }
      }

      // Enhanced retry logic for team logos
      const maxRetries = 2; // Allow 2 retries for team logos

      // For team logos, try different URL patterns
      if (!isLeagueLogo && extractedTeamId && retryCount === 0) {
        // First retry: try with different size parameter
        const newUrl = `/api/team-logo/square/${extractedTeamId}?size=64`;
        console.log(`🔄 [LazyImage] Team logo retry 1 - trying different size: ${newUrl}`);
        setImageSrc(newUrl);
        setRetryCount(1);
        setIsLoading(true);
        return;
      }

      if (!isLeagueLogo && extractedTeamId && retryCount === 1) {
        // Second retry: try with circular endpoint
        const newUrl = `/api/team-logo/circular/${extractedTeamId}?size=32`;
        console.log(`🔄 [LazyImage] Team logo retry 2 - trying circular: ${newUrl}`);
        setImageSrc(newUrl);
        setRetryCount(2);
        setIsLoading(true);
        return;
      }

      // Generic retry for other cases
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
      setImageSrc(fallbackUrl);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleLoad = () => {
    // Only update if currently loading or in error state
    if (!isLoading && !hasError) return;

    console.log(`✅ [LazyImage] Image loaded successfully:`, {
      alt,
      imageSrc,
      retryCount,
      wasError: hasError,
      component: "LazyImage",
    });

    // Enhanced team logo success logging (only for real logos)
    const isTeamLogo =
      imageSrc.includes("/api/team-logo/") ||
      imageSrc.includes("media.api-sports.io/football/teams/") ||
      imageSrc.includes("imagecache.365scores.com");

    if (isTeamLogo) {
      // Extract team ID and source for better tracking
      let teamId = "unknown";
      let source = "unknown";

      const apiMatch = imageSrc.match(/\/api\/team-logo\/(\d+)/);
      const mediaMatch = imageSrc.match(
        /media\.api-sports\.io\/football\/teams\/(\d+)/,
      );
      const scoresMatch = imageSrc.match(/Images\/(\d+)/);

      if (apiMatch) {
        teamId = apiMatch[1];
        source = "api-proxy";
      } else if (mediaMatch) {
        teamId = mediaMatch[1];
        source = "api-sports-direct";
      } else if (scoresMatch) {
        teamId = scoresMatch[1];
        source = "365scores";
      }

      console.log(
        `⚽ [LazyImage] Team logo loaded successfully (REAL LOGO):`,
        {
          alt,
          teamId,
          source,
          imageSrc,
          retryCount,
          wasError: hasError,
          component: "LazyImage",
        },
      );
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
    setIsLoading(false);
    onLoad?.();
  };



  return (
    <img
      {...restProps}
      src={imageSrc}
      alt={alt}
      title={title}
      className={className}
      style={{
        border: 'none',
        outline: 'none',
        display: hasError && imageSrc === fallbackUrl ? 'block' : (hasError ? 'none' : 'block'),
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        filter: darkMode ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
        // Apply size from props if no explicit width/height in style
        ...(style?.width || style?.height ? {} : {
          width: isMobile ? '24px' : '24px',
          height: isMobile ? '36px' : '36px'
        }),
        ...style, // User styles override defaults
      }}
      loading={shouldPreload ? 'eager' : loading}
      decoding={shouldPreload ? 'sync' : 'async'}
      fetchPriority={shouldPreload ? 'high' : 'auto'}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;