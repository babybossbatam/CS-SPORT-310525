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
    if (!hasError && retryCount < 2) {
      console.warn(
        `🖼️ [LazyImage] Failed to load image: ${imageSrc}, retry ${retryCount + 1}`,
      );

      // Add cache busting parameter to force fresh fetch
      const cacheBuster = `?t=${Date.now()}`;
      
      // If original source contains api-sports.io, try server proxy with cache buster
      if (imageSrc.includes("media.api-sports.io") && retryCount === 0) {
        const leagueMatch = imageSrc.match(/leagues\/(\d+)/);
        if (leagueMatch) {
          const leagueId = leagueMatch[1];
          const proxyUrl = `/api/league-logo/${leagueId}${cacheBuster}`;
          console.log(`🔄 [LazyImage] Trying server proxy with cache buster: ${proxyUrl}`);
          setImageSrc(proxyUrl);
          setRetryCount(retryCount + 1);
          return;
        }
      }

      // Add cache buster to original URL if it doesn't already have query params
      if (!imageSrc.includes('?') && !imageSrc.includes('t=')) {
        const freshUrl = imageSrc + cacheBuster;
        console.log(`🔄 [LazyImage] Retrying with cache buster: ${freshUrl}`);
        setImageSrc(freshUrl);
        setRetryCount(retryCount + 1);
        return;
      }

      // Final fallback after retries
      if (retryCount >= 1) {
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
  };

  const handleLoad = () => {
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
