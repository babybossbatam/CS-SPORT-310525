import React, { useState, Suspense, lazy } from 'react';
import MyLiveAction from '@/components/matches/MyLiveAction';
import { useDeviceInfo } from '@/hooks/use-mobile';
import BrandedLoading from '@/components/common/BrandedLoading';
import Header from '@/components/layout/Header'; // Assuming Header is imported
import Footer from '@/components/layout/Footer'; // Assuming Footer is imported
import { NetworkStatus } from "@/components/common/NetworkStatus"; // Added for network status

// Immediate mobile detection to prevent layout flash
const getIsMobileImmediate = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';

// Lazy load MobileBottomNav component
const MobileBottomNav = lazy(() => import('@/components/layout/MobileBottomNav'));

interface MyMainLayoutProps {
  selectedMatchId?: number;
  selectedMatch?: any;
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedDate?: string; // Assuming selectedDate is passed as a prop
}

// Helper function to validate date format
const isValidDate = (dateString: string): boolean => {
  // Allow 'today' as a special case
  if (dateString === 'today') return true;

  // Check if date string matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  // Check if it's a valid date
  const date = new Date(dateString + 'T00:00:00.000Z');
  const [year, month, day] = dateString.split('-').map(Number);

  // Allow reasonable date ranges (not too far in past/future)
  const currentYear = new Date().getFullYear();
  const isReasonableYear = year >= currentYear - 5 && year <= currentYear + 5;

  return date instanceof Date &&
         !isNaN(date.getTime()) &&
         date.getUTCFullYear() === year &&
         date.getUTCMonth() === month - 1 &&
         date.getUTCDate() === day &&
         isReasonableYear;
};

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
  selectedMatchId,
  selectedMatch,
  children,
  activeTab,
  onTabChange,
  selectedDate
}) => {
  // Reduce validation overhead - only validate in development
  if (process.env.NODE_ENV === 'development' && selectedDate && selectedDate !== 'today' && selectedDate && !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    console.warn(`🚨 [MyMainLayout] Invalid selectedDate format: ${selectedDate}`);
  }

  const [internalActiveTab, setInternalActiveTab] = useState<string>("match");
  const currentActiveTab = activeTab || internalActiveTab;

  // Optimize mobile detection to prevent blocking
  const [isMobileImmediate] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const { isMobile } = useDeviceInfo();

  // Use memoized mobile detection
  const actualIsMobile = useMemo(() => 
    isMobile !== undefined ? isMobile : isMobileImmediate,
    [isMobile, isMobileImmediate]
  );

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const isLive = selectedMatch?.fixture?.status?.short === 'LIVE' ||
                selectedMatch?.fixture?.status?.short === 'HT' ||
                selectedMatch?.fixture?.status?.short === '1H' ||
                selectedMatch?.fixture?.status?.short === '2H' ||
                selectedMatch?.fixture?.status?.short === 'LIV' ||
                selectedMatch?.fixture?.status?.short === 'ET' ||
                selectedMatch?.fixture?.status?.short === 'P' ||
                selectedMatch?.fixture?.status?.short === 'INT' ||
                selectedMatch?.fixture?.status?.short === 'SUSP' ||
                selectedMatch?.fixture?.status?.short === 'BT';

  return (
    <div className={`w-full space-y-6 ${actualIsMobile ? 'mobile-layout px-2 mobile-layout-active' : ''}`}>
      {/* MyLiveAction component - show for live matches */}
      {isLive && (
        <MyLiveAction
          matchId={selectedMatchId}
          homeTeam={selectedMatch?.teams?.home}
          awayTeam={selectedMatch?.teams?.away}
          status={selectedMatch?.fixture?.status?.short}
          className=""
        />
      )}

      {/* Tab Content for Selected Match */}
      {selectedMatch && (
        <div className={`mt-6 ${actualIsMobile ? 'mobile-tab-content' : ''}`}>
          {currentActiveTab === "match" && (
            <MyMatchTabCard match={selectedMatch} />
          )}

          {currentActiveTab === "stats" && (
            <MyStatsTabCard match={selectedMatch} />
          )}

          {currentActiveTab === "lineups" && (
            <MyLineupsTabsCard match={selectedMatch} />
          )}

          {currentActiveTab === "trends" && (
            <MyTrendsTabsCard match={selectedMatch} />
          )}

          {currentActiveTab === "h2h" && (
            <MyHeadtoheadTabsCard match={selectedMatch} />
          )}
        </div>
      )}

      {/* Any additional children content */}
      {children && (
        <div className={`mt-6 ${actualIsMobile ? 'mobile-children-content' : ''}`}>
          {children}
        </div>
      )}

      {/* Mobile Bottom Navigation - only show on mobile */}
      {actualIsMobile && (
        <Suspense fallback={<BrandedLoading />}>
          <MobileBottomNav />
        </Suspense>
      )}

      {/* Render network status indicator */}
      <NetworkStatus />
    </div>
  );
};

export default MyMainLayout;