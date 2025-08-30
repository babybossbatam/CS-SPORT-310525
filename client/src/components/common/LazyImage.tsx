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
  const isMountedRef = useRef<boolean>(true);

  // Get dark mode state from Redux store
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Get device info for responsive sizing
  const { isMobile } = useDeviceInfo();

  // Preload critical images
  const shouldPreload = priority === 'high' || priority === 'medium';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Preload image if it's high priority
  useEffect(() => {
    if (shouldPreload && src && !src.includes('fallback')) {
      const img = new Image();
      img.src = src;
    }
  }, [src, shouldPreload]);

  const fallbackUrl = "/assets/matchdetaillogo/fallback.png";

  useEffect(() => {
    if (!isMountedRef.current) return;

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
      setIsLoading(false);
    } else {
      setImageSrc(src);
      setHasError(false);
      setRetryCount(0);
      setIsLoading(true);
    }
  }, [src, alt, darkMode]);

  // Extract teamId from src for use throughout component
  const extractedTeamId = (imageSrc.match(/\/team-logo\/(?:square|circular)\/(\d+)/) || [])[1];

  const handleError = () => {
    if (!isMountedRef.current) return;

    try {
      console.log(`🚫 [LazyImage] Image failed to load:`, {
        src: imageSrc,
        alt: alt,
        originalSrc: src,
        retryCount,
        teamId: extractedTeamId,
        timestamp: new Date().toISOString()
      });

      setIsLoading(false);

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

        console.log(`🏆 [LazyImage] League logo error detected for: ${alt} (ID: ${leagueId})`);

        if (retryCount === 0 && leagueId !== "unknown") {
          const directApiUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
          console.log(`🏆 [LazyImage] League logo fallback: trying direct API-Sports for ${leagueId}`);
          setImageSrc(directApiUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }

        if (retryCount === 1 && leagueId !== "unknown") {
          const scoresUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitions/${leagueId}`;
          console.log(`🏆 [LazyImage] League logo second attempt: trying 365scores for ${leagueId}`);
          setImageSrc(scoresUrl);
          setRetryCount(retryCount + 1);
          setIsLoading(true);
          return;
        }
      }

      // Enhanced retry logic for team logos
      if (!isLeagueLogo && extractedTeamId && retryCount < 2) {
        if (retryCount === 0) {
          const newUrl = `/api/team-logo/square/${extractedTeamId}?size=64`;
          console.log(`🔄 [LazyImage] Team logo retry 1 - trying different size: ${newUrl}`);
          setImageSrc(newUrl);
          setRetryCount(1);
          setIsLoading(true);
          return;
        }

        if (retryCount === 1) {
          const newUrl = `/api/team-logo/circular/${extractedTeamId}?size=32`;
          console.log(`🔄 [LazyImage] Team logo retry 2 - trying circular: ${newUrl}`);
          setImageSrc(newUrl);
          setRetryCount(2);
          setIsLoading(true);
          return;
        }
      }

      // Final fallback
      console.warn(`🚫 [LazyImage] All retries failed for: ${src}, using fallback`);
      setHasError(true);
      setImageSrc(fallbackUrl);
      setIsLoading(false);
      onError?.();

    } catch (error) {
      console.warn("⚠️ [LazyImage] Error in handleError function:", error);
      if (isMountedRef.current) {
        setHasError(true);
        setImageSrc(fallbackUrl);
        setIsLoading(false);
        onError?.();
      }
    }
  };

  const handleLoad = () => {
    if (!isMountedRef.current) return;

    setIsLoading(false);

    if (hasError) {
      setHasError(false);
    }

    // Don't cache or log success for fallback images
    const isFallbackImage =
      imageSrc.includes("/assets/matchdetaillogo/fallback.png") ||
      imageSrc.includes("/assets/fallback-logo.svg") ||
      imageSrc.includes("fallback") ||
      imageSrc.includes("placeholder");

    if (isFallbackImage) {
      console.log(`⚠️ [LazyImage] Fallback image loaded: ${imageSrc}`);
      onLoad?.();
      return;
    }

    console.log(`✅ [LazyImage] Image loaded successfully: ${imageSrc}`);
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