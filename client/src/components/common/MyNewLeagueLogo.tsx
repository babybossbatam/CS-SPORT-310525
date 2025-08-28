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
    width: className.includes('w-') ? undefined : size,
    height: className.includes('h-') ? undefined : size,
    position: "relative" as const,
    backgroundColor: "transparent",
    background: "transparent",
    border: "none",
    outline: "none",
  };

  const imageStyle = {
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%",
    background: "transparent",
    border: "none",
    outline: "none",
    boxShadow: "none",
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
        // Test multiple sources for league logos
        const logoSources = [
          `/api/league-logo/${leagueId}`,
          `https://media.api-sports.io/football/leagues/${leagueId}.png`,
          `/assets/league-logos/${leagueId}.png`
        ];

        let logoLoaded = false;

        for (const sourceUrl of logoSources) {
          try {
            // Test if the image loads successfully
            const testImage = new Image();
            const imagePromise = new Promise((resolve, reject) => {
              testImage.onload = () => resolve(sourceUrl);
              testImage.onerror = () => reject(new Error('Image failed to load'));
              testImage.src = sourceUrl;
            });

            await imagePromise;
            console.log(`✅ [MyNewLeagueLogo] Successfully loaded league ${leagueId} from: ${sourceUrl}`);
            setLogoUrl(sourceUrl);
            logoLoaded = true;
            break;
          } catch (imageError) {
            console.log(`❌ [MyNewLeagueLogo] Failed to load league ${leagueId} from: ${sourceUrl}`);
            continue;
          }
        }

        if (!logoLoaded) {
          throw new Error('All logo sources failed');
        }

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

    const loadLogoWithLeagueLogic = async () => {
      if (!leagueId) {
        setLogoUrl(fallbackUrl || "/assets/fallback-logo.svg");
        return;
      }

      const localAssetUrl = shouldUseLocalAsset();
      let effectiveLogoUrl = localAssetUrl;

      if (leagueName) {
        const leagueNameLower = leagueName.toLowerCase();

        // English Premier League - prioritize ID 39 and explicit English context
        if (leagueNameLower.includes("premier league")) {
          // If league ID is 39 or explicitly mentions England/English, it's English Premier League
          if (leagueId === 39 || leagueNameLower.includes("england") || leagueNameLower.includes("english")) {
            console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 [MyNewLeagueLogo] English Premier League detected (ID ${leagueId}), using local asset`);
            effectiveLogoUrl = "/assets/league-logos/39.png";
          }
          // If it's generic "Premier League" without Egyptian context, assume English
          else if (!leagueNameLower.includes("egypt") && leagueId !== 233 && leagueId !== 42 && leagueId !== 294) {
            console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 [MyNewLeagueLogo] Generic Premier League detected (ID ${leagueId}), assuming English`);
            effectiveLogoUrl = "/assets/league-logos/39.png";
          }
          // Egyptian Premier League - check for Egypt context
          else if (leagueNameLower.includes("egypt") || leagueId === 233 || leagueId === 42 || leagueId === 294) {
            console.log(`🇪🇬 [MyNewLeagueLogo] Egyptian Premier League detected (ID ${leagueId}), using server proxy`);
            effectiveLogoUrl = null; // Let it fall through to use server proxy
          }
        }
      }

      if (effectiveLogoUrl !== null) {
        setLogoUrl(effectiveLogoUrl);
        return;
      }

      // If not handled by local assets or specific logic, proceed with fetching
      setIsLoading(true);
      setError(null);

      try {
        const logoSources = [
          `/api/league-logo/${leagueId}`,
          `https://media.api-sports.io/football/leagues/${leagueId}.png`,
          `/assets/league-logos/${leagueId}.png`
        ];

        let logoLoaded = false;

        for (const sourceUrl of logoSources) {
          try {
            const testImage = new Image();
            const imagePromise = new Promise((resolve, reject) => {
              testImage.onload = () => resolve(sourceUrl);
              testImage.onerror = () => reject(new Error('Image failed to load'));
              testImage.src = sourceUrl;
            });

            await imagePromise;
            console.log(`✅ [MyNewLeagueLogo] Successfully loaded league ${leagueId} from: ${sourceUrl}`);
            setLogoUrl(sourceUrl);
            logoLoaded = true;
            break;
          } catch (imageError) {
            console.log(`❌ [MyNewLeagueLogo] Failed to load league ${leagueId} from: ${sourceUrl}`);
            continue;
          }
        }

        if (!logoLoaded) {
          throw new Error('All logo sources failed');
        }

        setIsLoading(false);
      } catch (error) {
        console.error(
          `❌ [MyNewLeagueLogo] Error loading logo for league ${leagueId}:`,
          error,
        );
          // Re-check specific local assets after error, if not already handled
          const localAssetUrlOnError = shouldUseLocalAsset();
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

    loadLogoWithLeagueLogic();
  }, [leagueId, leagueName, fallbackUrl, enhancedLogoManager]);

  return (
    <div
      className={`league-logo-container ${className}`}
      style={{
        ...containerStyle
      }}
      onClick={onClick}
    >
      <LazyImage
        src={logoUrl}
        alt={leagueName || `League ${leagueId}`}
        title={leagueName}
        className="league-logo"
        style={imageStyle}
      />
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
};

export default MyNewLeagueLogo;