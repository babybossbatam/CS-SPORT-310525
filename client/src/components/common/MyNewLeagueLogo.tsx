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
    // Check for specific teams/leagues that should use local assets immediately
    const shouldUseLocalAsset = () => {
      if (leagueName) {
        const leagueNameLower = leagueName.toLowerCase();

        // COTIF Tournament league
        if (leagueNameLower.includes("cotif") || leagueNameLower.includes("cotif tournament")) {
          console.log(`🏆 [MyNewLeagueLogo] Using local COTIF Tournament logo from start`);
          return "/assets/matchdetaillogo/cotif tournament.png";
        }

        // Valencia team (including U20)
        if (leagueNameLower.includes("valencia") && !leagueNameLower.includes("rayo vallecano")) {
          console.log(`⚽ [MyNewLeagueLogo] Using local Valencia logo from start`);
          return "/assets/matchdetaillogo/valencia.png";
        }

        // Alboraya team (including U20)
        if (leagueNameLower.includes("alboraya") || leagueNameLower.includes("albaroya")) {
          console.log(`⚽ [MyNewLeagueLogo] Using local Alboraya logo from start`);
          return "/assets/matchdetaillogo/alboraya.png";
        }
      }
      return null;
    };

    const loadLogo = async () => {
      if (!leagueId) {
        setLogoUrl(fallbackUrl || "/assets/fallback-logo.svg");
        return;
      }

      const localAssetUrl = shouldUseLocalAsset();

      if (localAssetUrl) {
        setLogoUrl(localAssetUrl);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the working server proxy endpoint directly (same as LazyImage)
        const proxyUrl = `/api/league-logo/${leagueId}`;
        console.log(
          `✅ [MyNewLeagueLogo] Using server proxy for league ${leagueId}: ${proxyUrl}`,
        );
        setLogoUrl(proxyUrl);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error(
          `❌ [MyNewLeagueLogo] Error loading logo for league ${leagueId}:`,
          error,
        );
          // Check for specific teams/leagues that should use local assets after error
          const shouldUseLocalAssetOnError = () => {
            if (leagueName) {
              const leagueNameLower = leagueName.toLowerCase();

              // COTIF Tournament league
              if (leagueNameLower.includes("cotif") || leagueNameLower.includes("cotif tournament")) {
                console.log(`🏆 [MyNewLeagueLogo] Using local COTIF Tournament logo after error`);
                return "/assets/matchdetaillogo/cotif tournament.png";
              }

              // Valencia team (including U20)
              if (leagueNameLower.includes("valencia") && !leagueNameLower.includes("rayo vallecano")) {
                console.log(`⚽ [MyNewLeagueLogo] Using local Valencia logo after error`);
                return "/assets/matchdetaillogo/valencia.png";
              }

              // Alboraya team (including U20)
              if (leagueNameLower.includes("alboraya") || leagueNameLower.includes("albaroya")) {
                console.log(`⚽ [MyNewLeagueLogo] Using local Alboraya logo after error`);
                return "/assets/matchdetaillogo/alboraya.png";
              }
            }
            return null;
          };

          const localAssetUrlOnError = shouldUseLocalAssetOnError();
          if (localAssetUrlOnError) {
            setLogoUrl(localAssetUrlOnError);
            setIsLoading(false);
            return;
          }
        setError(error instanceof Error ? error.message : "Unknown error");
        const finalFallback = fallbackUrl || "/assets/fallback-logo.svg";
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
      <img
        src={logoUrl}
        alt={leagueName || `League ${leagueId}`}
        title={leagueName}
        className="league-logo"
        style={{
          ...imageStyle,
          borderRadius: '0%',
          backgroundColor: 'transparent',
          mixBlendMode: 'multiply'
        }}
        loading="lazy"
      />
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
};

export default MyNewLeagueLogo;