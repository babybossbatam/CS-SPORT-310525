import React, { useState, useEffect } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
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
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    // Safety check to prevent cascading errors
    try {
      // Special logging for Valencia/Spain flags
      const isSpainFlag = imageSrc.includes('/es.svg') || imageSrc.includes('/es.png') || 
                         (alt && alt.toLowerCase().includes('spain')) ||
                         (alt && alt.toLowerCase().includes('valencia'));
      
      if (isSpainFlag) {
        console.log(`🇪🇸 [LazyImage] VALENCIA/SPAIN FLAG ERROR:`, {
          imageSrc,
          alt,
          retryCount,
          hasError,
          component: 'LazyImage'
        });
      }

      // Enhanced league logo handling like MyNewLeague2
      const isLeagueLogo = imageSrc.includes('/api/league-logo/') || 
                          imageSrc.includes('media.api-sports.io/football/leagues/');
      
      if (isLeagueLogo) {
        console.log(`🏆 [LazyImage] League logo error detected for: ${alt}`, {
          imageSrc,
          retryCount,
          hasError
        });
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
          
          // From /api/league-logo/ID
          const apiMatch = imageSrc.match(/\/api\/league-logo\/(\d+)/);
          if (apiMatch) {
            leagueId = apiMatch[1];
          }
          
          // From media.api-sports.io/football/leagues/ID.png
          const mediaMatch = imageSrc.match(/media\.api-sports\.io\/football\/leagues\/(\d+)/);
          if (mediaMatch) {
            leagueId = mediaMatch[1];
          }
          
          if (leagueId) {
            // Try alternative API endpoint with cache buster (MyNewLeague2 pattern)
            const fallbackUrl = `/api/league-logo/square/${leagueId}${cacheBuster}`;
            console.log(`🔄 [LazyImage] Trying league logo fallback: ${fallbackUrl}`);
            setImageSrc(fallbackUrl);
            setRetryCount(retryCount + 1);
            return;
          }
        }
        
        // Second retry: Try direct API-Sports URL if not already tried
        if (isLeagueLogo && retryCount === 1) {
          let leagueId = null;
          
          const apiMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
          if (apiMatch) {
            leagueId = apiMatch[1];
            const directUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png${cacheBuster}`;
            console.log(`🔄 [LazyImage] Trying direct API-Sports URL: ${directUrl}`);
            setImageSrc(directUrl);
            setRetryCount(retryCount + 1);
            return;
          }
        }

        // General retry with cache buster for non-league logos
        if (!isLeagueLogo && !imageSrc.includes('?') && !imageSrc.includes('t=')) {
          const freshUrl = imageSrc + cacheBuster;
          console.log(`🔄 [LazyImage] Retrying with cache buster: ${freshUrl}`);
          setImageSrc(freshUrl);
          setRetryCount(retryCount + 1);
          return;
        }

        // Final fallback after all retries
        if (retryCount >= 2) {
          console.warn(
            `🚫 [LazyImage] All retries failed for: ${src}, using fallback`,
          );
          setHasError(true);
          setImageSrc("/assets/fallback-logo.svg");
          onError?.();
        } else {
          setRetryCount(retryCount + 1);
        }
      }
    } catch (error) {
      console.warn('⚠️ [LazyImage] Error in handleError function:', error);
      setHasError(true);
      setImageSrc("/assets/fallback-logo.svg");
      onError?.();
    }
  };

  const handleLoad = () => {
    // Special logging for Valencia/Spain flags
    const isSpainFlag = imageSrc.includes('/es.svg') || imageSrc.includes('/es.png') || 
                       (alt && alt.toLowerCase().includes('spain')) ||
                       (alt && alt.toLowerCase().includes('valencia'));
    
    if (isSpainFlag) {
      console.log(`🇪🇸 [LazyImage] VALENCIA/SPAIN FLAG SUCCESS:`, {
        imageSrc,
        alt,
        retryCount,
        wasError: hasError,
        component: 'LazyImage'
      });
    }

    // Enhanced league logo success logging (like MyNewLeague2)
    const isLeagueLogo = imageSrc.includes('/api/league-logo/') || 
                        imageSrc.includes('media.api-sports.io/football/leagues/');
    
    if (isLeagueLogo) {
      console.log(`🏆 [LazyImage] League logo loaded successfully:`, {
        alt,
        imageSrc,
        retryCount,
        wasError: hasError,
        component: 'LazyImage'
      });
    }

    if (hasError) {
      console.log(`✅ [LazyImage] Recovered and loaded: ${imageSrc}`);
    }
    setHasError(false);
    onLoad?.();
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      title={title}
      className={className}
      style={style}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;
