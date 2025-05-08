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