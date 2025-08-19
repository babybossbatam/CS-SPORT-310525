
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { isNationalTeam, getTeamLogoSources, createTeamLogoErrorHandler } from '../../lib/teamLogoSources';
import { enhancedLogoManager } from '../../lib/enhancedLogoManager';
import { getBestTeamLogoUrl, createTeamLogoErrorHandler as createBetterErrorHandler } from '../../lib/teamLogoUtils';

interface MyWorldTeamLogoProps {
  teamId: number | string;
  teamName?: string;
  size?: number;
  className?: string;
  fallbackText?: string;
  priority?: 'high' | 'medium' | 'low';
  onLoad?: () => void;
  onError?: (error: string) => void;
}

// Cache for circular flag decisions
const circularFlagCache = new Map<string, boolean>();

export default function MyWorldTeamLogo({
  teamId,
  teamName = '',
  size = 32,
  className = '',
  fallbackText,
  priority = 'medium',
  onLoad,
  onError
}: MyWorldTeamLogoProps) {
  // All hooks must be called unconditionally at the top level
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize team info to prevent unnecessary recalculations
  const teamInfo = useMemo(() => ({
    id: String(teamId),
    name: teamName,
    isNational: isNationalTeam(teamName),
    cacheKey: `team-${teamId}-${teamName}`.toLowerCase()
  }), [teamId, teamName]);

  // Memoize logo sources
  const logoSources = useMemo(() => {
    try {
      return getTeamLogoSources(teamInfo.id, teamInfo.name);
    } catch (error) {
      console.warn('Error getting logo sources:', error);
      return [];
    }
  }, [teamInfo.id, teamInfo.name]);

  // Check if should use circular flag (cached)
  const shouldUseCircularFlag = useMemo(() => {
    const cacheKey = `shouldUseCircularFlag: ${teamName}`;
    
    if (circularFlagCache.has(cacheKey)) {
      const cached = circularFlagCache.get(cacheKey)!;
      console.log(`💾 [MyWorldTeamLogo] Cache hit for shouldUseCircularFlag: ${teamName}`);
      return cached;
    }

    const result = teamInfo.isNational && (
      teamName.toLowerCase().includes('u21') ||
      teamName.toLowerCase().includes('u20') ||
      teamName.toLowerCase().includes('u19') ||
      teamName.toLowerCase().includes('u18') ||
      teamName.toLowerCase().includes('u17') ||
      teamName.toLowerCase().includes('under') ||
      teamName.toLowerCase().includes('youth')
    );
    
    circularFlagCache.set(cacheKey, result);
    return result;
  }, [teamInfo.isNational, teamName]);

  // Error handler
  const handleError = useCallback((errorMsg: string) => {
    console.warn(`[MyWorldTeamLogo] Error for team ${teamName}:`, errorMsg);
    setHasError(true);
    setIsLoading(false);
    onError?.(errorMsg);
  }, [teamName, onError]);

  // Load success handler
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Image load handler
  const handleImageLoad = useCallback(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      handleLoad();
    }
  }, [handleLoad]);

  // Image error handler
  const handleImageError = useCallback(() => {
    if (retryCount < logoSources.length - 1) {
      setRetryCount(prev => prev + 1);
    } else {
      handleError('All logo sources failed');
    }
  }, [retryCount, logoSources.length, handleError]);

  // Main effect to load logo
  useEffect(() => {
    if (!teamInfo.id) {
      handleError('No team ID provided');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);

    const loadLogo = async () => {
      try {
        // Try enhanced logo manager first
        const enhancedResult = await enhancedLogoManager.getTeamLogo(
          teamInfo.id,
          teamInfo.name,
          { priority, useCircularFlag: shouldUseCircularFlag }
        );

        if (enhancedResult.success && enhancedResult.url) {
          setCurrentSrc(enhancedResult.url);
          return;
        }

        // Fallback to team logo utils
        const fallbackUrl = getBestTeamLogoUrl(teamInfo.id, teamInfo.name);
        if (fallbackUrl) {
          setCurrentSrc(fallbackUrl);
          return;
        }

        // Use first available source
        if (logoSources.length > 0) {
          setCurrentSrc(logoSources[0]);
          return;
        }

        handleError('No logo sources available');
      } catch (error) {
        handleError(`Logo loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    loadLogo();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [teamInfo.id, teamInfo.name, priority, shouldUseCircularFlag, logoSources, handleError]);

  // Update source when retry count changes
  useEffect(() => {
    if (retryCount > 0 && retryCount < logoSources.length) {
      setCurrentSrc(logoSources[retryCount]);
    }
  }, [retryCount, logoSources]);

  // Render fallback if error or no source
  if (hasError || !currentSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-500 text-center px-1">
          {fallbackText || teamName?.slice(0, 3) || '?'}
        </span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={teamName || 'Team logo'}
      className={`object-cover ${shouldUseCircularFlag ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width: size, height: size }}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={priority === 'high' ? 'eager' : 'lazy'}
    />
  );
}
