import React, { useEffect, useState } from "react";
import LazyImage from "./LazyImage";

// Define the props for the MyNewLeagueLogo component
interface MyNewLeagueLogoProps {
  leagueId: number | string;
  leagueName?: string;
  size?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  fallbackUrl?: string;
  enhancedLogoManager?: any; // Replace 'any' with a more specific type if available")
}

const MyNewLeagueLogo: React.FC<MyNewLeagueLogoProps> = ({
  leagueId,
  leagueName = "Unknown League",
  size = "24px",
  className = "",
  style,
  onClick,
  fallbackUrl = "",
  enhancedLogoManager,
}) => {
  const [logoUrl, setLogoUrl] = useState(fallbackUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerStyle = {
    width: size,
    height: size,
    position: "relative" as const,
  };

  const imageStyle = {
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%",
    ...style,
  };

  useEffect(() => {
    const loadLogo = async () => {
      if (!leagueId) {
        setLogoUrl(fallbackUrl || '/assets/fallback-logo.svg');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Priority 1: Use server proxy endpoint (most reliable)
        console.log(
          `🔍 [MyNewLeagueLogo] Trying server proxy for league ${leagueId}`,
        );

        const proxyUrl = `/api/league-logo/${leagueId}`;
        
        // Test if proxy endpoint works with a quick HEAD request
        try {
          const proxyResponse = await fetch(proxyUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (proxyResponse.ok) {
            console.log(
              `✅ [MyNewLeagueLogo] Server proxy working for league ${leagueId}`,
            );
            setLogoUrl(proxyUrl);
            setIsLoading(false);
            return;
          }
        } catch (proxyError) {
          console.warn(
            `⚠️ [MyNewLeagueLogo] Server proxy failed for league ${leagueId}:`,
            proxyError
          );
        }

        // Priority 2: Try to get league information from API
        console.log(
          `🔍 [MyNewLeagueLogo] Trying API endpoint for league ${leagueId}`,
        );

        const response = await fetch(`/api/leagues/${leagueId}`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
          const leagueData = await response.json();
          const leagueLogo = leagueData?.league?.logo;

          if (leagueLogo && !leagueLogo.includes('media.api-sports.io')) {
            console.log(
              `✅ [MyNewLeagueLogo] Got safe league logo from API: ${leagueLogo}`,
            );
            setLogoUrl(leagueLogo);
            setIsLoading(false);
            return;
          }
        }

        // Priority 3: Use enhanced logo manager with enhanced options
        console.log(
          `🔄 [MyNewLeagueLogo] Trying enhanced logo manager for league ${leagueId}`,
        );

        if (enhancedLogoManager) {
          const result = await enhancedLogoManager.getLeagueLogo(
            leagueId,
            leagueName,
          );

          if (result && result.url) {
            console.log(
              `✅ [MyNewLeagueLogo] Enhanced manager result for league ${leagueId}: ${result.url}`,
            );
            setLogoUrl(result.url);
            setIsLoading(false);
            return;
          }
        }

        // Final fallback
        const finalFallback = fallbackUrl || '/assets/fallback-logo.svg';
        console.log(
          `🚫 [MyNewLeagueLogo] All methods failed, using fallback for league ${leagueId}: ${finalFallback}`,
        );
        setLogoUrl(finalFallback);

      } catch (error) {
        console.error(
          `❌ [MyNewLeagueLogo] Error loading logo for league ${leagueId}:`,
          error,
        );
        setError(error instanceof Error ? error.message : "Unknown error");
        const finalFallback = fallbackUrl || '/assets/fallback-logo.svg';
        setLogoUrl(finalFallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, [leagueId, leagueName, fallbackUrl, enhancedLogoManager]);

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
        loading="lazy"
      />
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
};

export default MyNewLeagueLogo;
