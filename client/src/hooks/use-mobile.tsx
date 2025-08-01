import { useState, useEffect } from 'react';

/**
 * Hook to detect if current screen is mobile size
 * @param breakpoint Width threshold to consider as mobile (default 768px)
 * @returns Boolean indicating if screen is mobile size
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check on initial render
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value
    checkMobile();

    // Set up event listener
    window.addEventListener('resize', checkMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect current screen size category
 * @returns Screen size category: 'xs', 'sm', 'md', 'lg', 'xl', or '2xl'
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setScreenSize('xs');
      } else if (width < 768) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else if (width < 1280) {
        setScreenSize('lg');
      } else if (width < 1536) {
        setScreenSize('xl');
      } else {
        setScreenSize('2xl');
      }
    };

    // Set initial value
    handleResize();

    // Set up event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

/**
 * Enhanced mobile detection with device type and orientation
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isPortrait: false,
    isLandscape: false,
    screenWidth: 0,
    screenHeight: 0,
    isTouchDevice: false
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isPortrait: height > width,
        isLandscape: width > height,
        screenWidth: width,
        screenHeight: height,
        isTouchDevice
      });
    };

    // Initial check
    updateDeviceInfo();

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

/**
 * Hook for mobile-specific viewport adjustments
 */
export function useMobileViewport() {
  useEffect(() => {
    // Set viewport meta for mobile optimization
    const setViewportMeta = () => {
      let viewport = document.querySelector('meta[name=viewport]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    };

    // Prevent zoom on input focus (iOS Safari)
    const preventZoom = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        target.style.fontSize = '16px';
      }
    };

    setViewportMeta();
    
    // Add listeners for input focus to prevent zoom
    document.addEventListener('focusin', preventZoom);
    
    return () => {
      document.removeEventListener('focusin', preventZoom);
    };
  }, []);
}