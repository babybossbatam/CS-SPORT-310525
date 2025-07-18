import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import TeamLogo from "./TeamLogo";
import LazyImage from "../common/LazyImage";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import {
  getTeamColor,
  getEnhancedHomeTeamGradient,
} from "@/lib/colorExtractor";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load the heavy featured match component
const LazyFeaturedMatchContent = lazy(() => import('./MyHomeFeaturedMatchContent'));

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

// Skeleton component for loading state
const FeaturedMatchSkeleton: React.FC = () => (
  <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
    <Badge
      variant="secondary"
      className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
    >
      Featured Match
    </Badge>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2 justify-center">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-4">
        {/* Match status skeleton */}
        <div className="text-center">
          <Skeleton className="h-4 w-20 mx-auto mb-2" />
          <Skeleton className="h-8 w-16 mx-auto" />
        </div>

        {/* Teams display skeleton */}
        <div className="relative mt-4">
          <div className="flex relative h-[53px] rounded-md mb-8">
            <div className="w-full h-full flex justify-between relative">
              {/* Home team section */}
              <div className="flex items-center w-[45%]">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 ml-4" />
              </div>

              {/* VS section */}
              <div className="flex items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>

              {/* Away team section */}
              <div className="flex items-center justify-end w-[45%]">
                <Skeleton className="h-6 w-24 mr-4" />
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            </div>
          </div>

          {/* Match details skeleton */}
          <div className="text-center">
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex justify-around border-t border-gray-200 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-5 w-5 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Navigation indicators skeleton */}
        <div className="flex justify-center mt-4 gap-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-1.5 h-1.5 rounded-full" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  maxMatches = 15,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggeredLoad, setHasTriggeredLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredLoad) {
          console.log('🔄 [MyHomeFeaturedMatchNew] Component became visible, triggering lazy load');
          setIsVisible(true);
          setHasTriggeredLoad(true);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of component is visible
        rootMargin: '50px', // Start loading 50px before component enters viewport
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasTriggeredLoad]);

  return (
    <div ref={elementRef}>
      {isVisible ? (
        <Suspense fallback={<FeaturedMatchSkeleton />}>
          <LazyFeaturedMatchContent maxMatches={maxMatches} />
        </Suspense>
      ) : (
        <FeaturedMatchSkeleton />
      )}
    </div>
  );
};

export default MyHomeFeaturedMatchNew;