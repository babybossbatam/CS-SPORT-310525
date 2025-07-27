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

        // Priority 1: Use fixture-provided URL if available and it's a reliable source
        if (providedLogoUrl && providedLogoUrl.trim() !== '') {
          // Check if it's a direct API-Sports URL (which often timeout)
          if (providedLogoUrl.includes('media.api-sports.io')) {
            console.log(`⚠️ [MyNewLeagueLogo] Fixture URL is API-Sports direct (may timeout), using server proxy instead for league ${leagueId}`);
            // Skip to server proxy instead of using direct CDN URL
          } else {
            console.log(`✅ [MyNewLeagueLogo] Using fixture logo for league ${leagueId}: ${providedLogoUrl}`);
            setLogoUrl(providedLogoUrl);
            setIsLoading(false);
            setError(null);
            return;
          }
        }

        // Priority 2: Use server proxy (most reliable)
        console.log(`🔄 [MyNewLeagueLogo] Fetching via server proxy for league ${leagueId}`);
        const result = await enhancedLogoManager.getLeagueLogo('MyNewLeagueLogo', {
          type: 'league',
          shape: 'normal',
          leagueId: numericLeagueId,
          leagueName,
          fallbackUrl
        });

        if (result.fallbackUsed) {
          console.log(`🚫 [MyNewLeagueLogo] Logo failed for league ${leagueId}, using fallback: ${result.url}`);
          setLogoUrl(result.url);
        } else {
          // Test if the server proxy URL actually works
          console.log(`🧪 [MyNewLeagueLogo] Testing server proxy URL for league ${leagueId}: ${result.url}`);
          
          try {
            const testResponse = await fetch(result.url, { method: 'HEAD', timeout: 3000 });
            if (testResponse.ok) {
              console.log(`✅ [MyNewLeagueLogo] Server proxy URL verified for league ${leagueId}`);
              setLogoUrl(result.url);
            } else {
              console.warn(`⚠️ [MyNewLeagueLogo] Server proxy returned ${testResponse.status} for league ${leagueId}, using fallback`);
              setLogoUrl(fallbackUrl);
            }
          } catch (error) {
            console.warn(`⚠️ [MyNewLeagueLogo] Server proxy URL test failed for league ${leagueId}:`, error);
            setLogoUrl(fallbackUrl);
          }
        }
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

  const handleError = (event?: any) => {
    setIsLoading(false);
    const currentUrl = logoUrl;
    const errorDetails = event?.target?.src || currentUrl;
    
    // Only fall back if we're not already using the fallback
    if (currentUrl !== fallbackUrl) {
      setError(`Logo failed to load, using fallback: ${fallbackUrl}`);
      setLogoUrl(fallbackUrl);
      console.warn(`🚫 [MyNewLeagueLogo] Image load failed for league ${leagueId}`, {
        failedUrl: errorDetails,
        fallingBackTo: fallbackUrl,
        currentUrl: currentUrl
      });
    } else {
      console.warn(`🚫 [MyNewLeagueLogo] Even fallback failed for league ${leagueId}`);
    }
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