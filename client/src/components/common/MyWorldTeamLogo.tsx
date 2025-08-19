
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { enhancedLogoManager } from "@/lib/enhancedLogoManager";
import LazyImage from "./LazyImage";

interface MyWorldTeamLogoProps {
  teamId?: string | number;
  teamName: string;
  teamLogo?: string;
  alt?: string;
  size?: number | string;
  className?: string;
  leagueContext?: {
    name: string;
    country: string;
  };
  onError?: () => void;
  priority?: boolean;
}

const MyWorldTeamLogo: React.FC<MyWorldTeamLogoProps> = ({
  teamId,
  teamName,
  teamLogo: providedLogo,
  alt,
  size = 64,
  className = "",
  leagueContext,
  onError,
  priority = false,
}) => {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useCircularFlag, setUseCircularFlag] = useState(false);

  // Memoize team info to prevent unnecessary re-renders
  const teamInfo = useMemo(() => ({
    id: teamId ? Number(teamId) : 0,
    name: teamName || "",
    logo: providedLogo || "",
    leagueContext: leagueContext || null,
  }), [teamId, teamName, providedLogo, leagueContext]);

  // Memoize the logo resolution logic
  const resolveLogo = useCallback(async () => {
    if (!teamInfo.name || !teamInfo.id) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      console.log(`🏟️ [MyWorldTeamLogo] Resolving logo for team ${teamInfo.id} (${teamInfo.name})`);

      // Use enhanced logo manager with correct parameters
      const result = await enhancedLogoManager.getTeamLogo(
        'MyWorldTeamLogo',
        {
          type: 'team',
          shape: 'normal',
          teamId: teamInfo.id,
          teamName: teamInfo.name,
          fallbackUrl: '/assets/fallback-logo.svg'
        }
      );

      if (result.url && !result.fallbackUsed) {
        setLogoUrl(result.url);
        setUseCircularFlag(false);
        console.log(`✅ [MyWorldTeamLogo] Successfully resolved logo for ${teamInfo.name}: ${result.url}`);
      } else {
        // Check if it's a national team that should use circular flag
        const isNational = teamInfo.name.toLowerCase().includes('national') || 
                          teamInfo.name.includes('U21') || 
                          teamInfo.name.includes('U20') ||
                          teamInfo.leagueContext?.name?.toLowerCase().includes('international');
        
        if (isNational && teamInfo.leagueContext?.country) {
          // Try to get country flag
          const flagResult = await enhancedLogoManager.getCountryFlag(
            'MyWorldTeamLogo',
            {
              type: 'flag',
              shape: 'circular',
              country: teamInfo.leagueContext.country,
              fallbackUrl: '/assets/world flag_new.png'
            }
          );
          
          setLogoUrl(flagResult.url);
          setUseCircularFlag(true);
          console.log(`🏳️ [MyWorldTeamLogo] Using country flag for ${teamInfo.name}: ${flagResult.url}`);
        } else {
          throw new Error("No suitable logo found");
        }
      }
    } catch (error) {
      console.warn(`❌ [MyWorldTeamLogo] Logo resolution failed for ${teamInfo.name}:`, error);
      setHasError(true);
      setLogoUrl('/assets/fallback-logo.svg');
      if (onError) {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  }, [teamInfo, onError]);

  // Effect to resolve logo
  useEffect(() => {
    resolveLogo();
  }, [resolveLogo]);

  // Memoize style object
  const sizeStyle = useMemo(() => {
    const sizeValue = typeof size === 'number' ? `${size}px` : size;
    return {
      width: sizeValue,
      height: sizeValue,
      minWidth: sizeValue,
      minHeight: sizeValue,
    };
  }, [size]);

  // Fallback URL
  const fallbackUrl = useMemo(() => {
    if (useCircularFlag) {
      return "/assets/world flag_new.png";
    }
    return "/assets/fallback-logo.svg";
  }, [useCircularFlag]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center ${className}`}
        style={sizeStyle}
        aria-label={`Loading logo for ${teamInfo.name}`}
      >
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    );
  }

  // Show error state or resolved logo
  return (
    <LazyImage
      src={hasError ? fallbackUrl : logoUrl}
      alt={alt || `${teamInfo.name} logo${hasError ? ' (fallback)' : ''}`}
      className={`object-contain ${className}`}
      style={sizeStyle}
      fallbackSrc={fallbackUrl}
      priority={priority}
      onError={() => {
        if (!hasError) {
          console.warn(`🚫 [MyWorldTeamLogo] Image load error for ${teamInfo.name}, switching to fallback`);
          setHasError(true);
          if (onError) {
            onError();
          }
        }
      }}
    />
  );
};

export default MyWorldTeamLogo;
