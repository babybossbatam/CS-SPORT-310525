
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
  const teamInfo = useMemo(() => {
    const info = {
      id: teamId ? Number(teamId) : 0,
      name: teamName || "",
      logo: providedLogo || "",
      leagueContext: leagueContext || null,
    };
    
    // Debug logging for team info
    if (info.id === 0 || !info.name) {
      console.warn(`⚠️ [MyWorldTeamLogo] Problematic team data:`, {
        originalTeamId: teamId,
        convertedId: info.id,
        teamName: info.name,
        providedLogo: providedLogo,
        leagueContext: leagueContext
      });
    }
    
    return info;
  }, [teamId, teamName, providedLogo, leagueContext]);

  // Effect to resolve logo
  useEffect(() => {
    const resolveLogo = async () => {
      // Validate required data
      if (!teamInfo.name || !teamInfo.id || teamInfo.id === 0) {
        console.warn(`⚠️ [MyWorldTeamLogo] Invalid team data - ID: ${teamInfo.id}, Name: "${teamInfo.name}"`);
        setIsLoading(false);
        setHasError(true);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        console.log(`🏟️ [MyWorldTeamLogo] Resolving logo for team ${teamInfo.id} (${teamInfo.name})`);

        // Check if provided logo URL is valid first
        if (providedLogo && !providedLogo.includes('fallback') && !providedLogo.includes('placeholder')) {
          console.log(`🎯 [MyWorldTeamLogo] Using provided logo URL: ${providedLogo}`);
          setLogoUrl(providedLogo);
          setUseCircularFlag(false);
          setIsLoading(false);
          return;
        }

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

        console.log(`📊 [MyWorldTeamLogo] Logo manager result for ${teamInfo.name}:`, {
          url: result.url,
          fallbackUsed: result.fallbackUsed,
          cached: result.cached
        });

        if (result.url && !result.fallbackUsed) {
          setLogoUrl(result.url);
          setUseCircularFlag(false);
          console.log(`✅ [MyWorldTeamLogo] Successfully resolved logo for ${teamInfo.name}: ${result.url}`);
        } else {
          // Check if it's a national team that should use circular flag
          const isNational = teamInfo.name.toLowerCase().includes('national') || 
                            teamInfo.name.includes('U21') || 
                            teamInfo.name.includes('U20') ||
                            teamInfo.name.includes('U19') ||
                            teamInfo.name.includes('U23') ||
                            teamInfo.leagueContext?.name?.toLowerCase().includes('international');
          
          if (isNational && teamInfo.leagueContext?.country) {
            console.log(`🏳️ [MyWorldTeamLogo] Attempting country flag for ${teamInfo.name} (${teamInfo.leagueContext.country})`);
            
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
            console.warn(`🚫 [MyWorldTeamLogo] No suitable logo found for ${teamInfo.name}, using fallback`);
            setHasError(true);
            setLogoUrl('/assets/fallback-logo.svg');
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
    };

    resolveLogo();
  }, [teamInfo.id, teamInfo.name, teamInfo.leagueContext, providedLogo, onError]);

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
