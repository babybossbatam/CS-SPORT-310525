import React, { useState, useEffect, useMemo } from 'react';
import { enhancedLogoManager } from '../../lib/enhancedLogoManager';
import LazyImage from './LazyImage';

interface MyNewLeagueLogoProps {
  leagueId: number | string;
  leagueName?: string;
  logoUrl?: string; // Direct logo URL from fixture data
  size?: string;
  className?: string;
  fallbackUrl?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const MyNewLeagueLogo: React.FC<MyNewLeagueLogoProps> = ({
  leagueId,
  leagueName = 'Unknown League',
  logoUrl: providedLogoUrl, // Logo from fixture response
  size = '24px',
  className = '',
  fallbackUrl = '/assets/fallback-logo.svg',
  style,
  onClick
}) => {
  const [logoUrl, setLogoUrl] = useState<string>(providedLogoUrl || fallbackUrl);
  const [isLoading, setIsLoading] = useState(!providedLogoUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a logo URL from fixture data, use it directly
    if (providedLogoUrl && providedLogoUrl.trim() !== '') {
      console.log(`✅ [MyNewLeagueLogo] Using fixture logo for league ${leagueId}: ${providedLogoUrl}`);
      setLogoUrl(providedLogoUrl);
      setIsLoading(false);
      return;
    }

    // Only fetch if no logo URL provided and we have a valid league ID
    const fetchLogo = async () => {
      if (!leagueId || leagueId === 'Unknown') {
        setLogoUrl(fallbackUrl);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const numericLeagueId = typeof leagueId === 'string' ? parseInt(leagueId) : leagueId;

        if (isNaN(numericLeagueId)) {
          console.warn(`🚫 [MyNewLeagueLogo] Invalid league ID: ${leagueId}`);
          setLogoUrl(fallbackUrl);
          setIsLoading(false);
          return;
        }

        const result = await enhancedLogoManager.getLeagueLogo('MyNewLeagueLogo', {
          type: 'league',
          shape: 'normal',
          leagueId: numericLeagueId,
          leagueName,
          fallbackUrl
        });

        if (result.fallbackUsed) {
          console.log(`🚫 [MyNewLeagueLogo] Logo failed for league ${leagueId}, using fallback: ${result.url}`);
        } else {
          console.log(`✅ [MyNewLeagueLogo] Successfully loaded league ${leagueId} logo`);
        }

        setLogoUrl(result.url);
      } catch (error) {
        console.error(`❌ [MyNewLeagueLogo] Error loading logo for league ${leagueId}:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLogoUrl(fallbackUrl);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [leagueId, leagueName, providedLogoUrl, fallbackUrl]);

  // Memoized inline styles
  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    position: "relative" as const,
  }), [size]);

  const imageStyle = useMemo(() => ({ 
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%",
    opacity: isLoading ? 0.7 : 1,
    transition: 'opacity 0.2s ease-in-out',
    ...style
  }), [isLoading, style]);

  const handleLoad = () => {
    setIsLoading(false);
    if (!error) {
      console.log(`✅ [MyNewLeagueLogo] Successfully loaded league ${leagueId} logo`);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setError(`Logo failed to load, using fallback: ${fallbackUrl}`);
    setLogoUrl(fallbackUrl);
    console.warn(`🚫 [MyNewLeagueLogo] Logo failed for league ${leagueId}, using fallback: ${fallbackUrl}`);

  };

  // For league logos, use regular LazyImage with cached URL
  return (
    <div
      className={`league-logo-container ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      <LazyImage
        src={logoUrl}
        alt={leagueName || `League ${leagueId}`}
        title={leagueName}
        className="league-logo"
        style={imageStyle}
        fallbackSrc={fallbackUrl}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

export default MyNewLeagueLogo;