
import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface PreloadRoute {
  path: string;
  component: () => Promise<any>;
}

const preloadRoutes: PreloadRoute[] = [
  {
    path: '/football',
    component: () => import('@/pages/Football')
  },
  {
    path: '/basketball', 
    component: () => import('@/pages/Basketball')
  }
];

export const usePagePreload = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Preload likely next pages based on current route
    const preloadNextPages = () => {
      if (location === '/') {
        // On home, preload football (most popular)
        import('@/pages/Football');
      } else if (location.includes('/football')) {
        // On football, preload match details
        import('@/pages/MatchDetails');
      }
    };

    // Delay preloading to not interfere with current page
    const timer = setTimeout(preloadNextPages, 1000);
    return () => clearTimeout(timer);
  }, [location]);

  // Prefetch on hover
  const prefetchPage = (path: string) => {
    const route = preloadRoutes.find(r => r.path === path);
    if (route) {
      route.component();
    }
  };

  return { prefetchPage };
};
