
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
  // Always call hooks in the same order
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useCircularFlag, setUseCircularFlag] = useState(false);

  // Memoize team info to prevent unnecessary re-renders
  const teamInfo = useMemo(() => ({
    id: teamId ? String(teamId) : "",
    name: teamName || "",
    logo: providedLogo || "",
    leagueContext: leagueContext || null,
  }), [teamId, teamName, providedLogo, leagueContext]);

  // Memoize the logo resolution logic
  const resolveLogo = useCallback(async () => {
    if (!teamInfo.name) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      // Use enhanced logo manager to get the best logo
      const result = await enhancedLogoManager.getTeamLogo({
        teamId: teamInfo.id,
        teamName: teamInfo.name,
        providedLogo: teamInfo.logo,
        leagueContext: teamInfo.leagueContext,
      });

      if (result.logoUrl) {
        setLogoUrl(result.logoUrl);
        setUseCircularFlag(result.shouldUseCircularFlag || false);
      } else {
        throw new Error("No logo URL found");
      }
    } catch (error) {
      console.warn(`Logo resolution failed for ${teamInfo.name}:`, error);
      setHasError(true);
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

  // Show error state
  if (hasError || !logoUrl) {
    return (
      <LazyImage
        src={fallbackUrl}
        alt={alt || `${teamInfo.name} logo (fallback)`}
        className={`object-contain ${className}`}
        style={sizeStyle}
        fallbackSrc="/assets/fallback-logo.svg"
        priority={priority}
      />
    );
  }

  // Show resolved logo
  return (
    <LazyImage
      src={logoUrl}
      alt={alt || `${teamInfo.name} logo`}
      className={`object-contain ${className}`}
      style={sizeStyle}
      fallbackSrc={fallbackUrl}
      priority={priority}
      onError={() => {
        setHasError(true);
        if (onError) {
          onError();
        }
      }}
    />
  );
};

export default MyWorldTeamLogo;
