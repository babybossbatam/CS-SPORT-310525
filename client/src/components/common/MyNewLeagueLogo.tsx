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
        setLogoUrl(fallbackUrl);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First try to get league information directly from the API
        console.log(
          `🔍 [MyNewLeagueLogo] Fetching league info for league ${leagueId}`,
        );

        const response = await fetch(`/api/leagues/${leagueId}`);

        if (response.ok) {
          const leagueData = await response.json();
          const leagueLogo = leagueData?.league?.logo;

          if (leagueLogo) {
            console.log(
              `✅ [MyNewLeagueLogo] Got league logo from API: ${leagueLogo}`,
            );
            setLogoUrl(leagueLogo);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to enhanced logo manager if API doesn't have logo
        console.log(
          `🔄 [MyNewLeagueLogo] API didn't provide logo, trying enhanced manager`,
        );
        const result = await enhancedLogoManager.getLeagueLogo(
          leagueId,
          leagueName,
        );

        if (result.fallbackUsed) {
          console.log(
            `🚫 [MyNewLeagueLogo] Using fallback for league ${leagueId}: ${result.url}`,
          );
          setLogoUrl(result.url);
        } else {
          console.log(
            `✅ [MyNewLeagueLogo] Using enhanced manager result for league ${leagueId}: ${result.url}`,
          );
          setLogoUrl(result.url);
        }
      } catch (error) {
        console.error(
          `❌ [MyNewLeagueLogo] Error loading logo for league ${leagueId}:`,
          error,
        );
        setError(error instanceof Error ? error.message : "Unknown error");
        setLogoUrl(fallbackUrl);
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
