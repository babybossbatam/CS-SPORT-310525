import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions } from '@/lib/store';

interface SportsCategoryTabsProps {
  onSportClick?: (sportId: string) => void;
}

import { cn } from '@/lib/utils';
import { 
  Tv, 
  Trophy, 
  Cuboid, 
  Dumbbell, 
  Beaker, 
  Tablet, 
  Flag, 
  Award, 
  Volleyball, 
  Bug 
} from 'lucide-react';

const SportsCategoryTabs = ({ onSportClick }: SportsCategoryTabsProps) => {
  const [location] = useLocation();
  const dispatch = useDispatch();
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isMatchDetailsPage = location.startsWith('/match/');
  const isLeagueDetailsPage = location.startsWith('/league/');

  if (isLeagueDetailsPage) {
    return null;
  }

  // Add selectedLeague state
  const [selectedLeague, setSelectedLeague] = useState({ name: 'League', logo: 'https://via.placeholder.com/40' });

  // Define sports categories
  const categories = [
    { id: 'tv', name: 'TV', icon: Tv },
    { id: 'football', name: 'Football', icon: Trophy },
    { id: 'basketball', name: 'Basketball', icon: Cuboid },
    { id: 'hockey', name: 'Hockey', icon: Dumbbell },
    { id: 'baseball', name: 'Baseball', icon: Beaker },
    { id: 'tennis', name: 'Tennis', icon: Tablet },
    { id: 'handball', name: 'Handball', icon: Flag },
    { id: 'rugby', name: 'Rugby', icon: Award },
    { id: 'volleyball', name: 'Volleyball', icon: Volleyball },
    { id: 'cricket', name: 'Cricket', icon: Bug },
  ];

  // Define league navigation items
  const leagueNavItems = [
    { name: 'Details', href: '#details' },
    { name: 'Matches', href: '#matches' },
    { name: 'Standings', href: '#standings' },
    { name: 'News', href: '#news' },
    { name: 'Highlights', href: '#highlights' },
    { name: 'Transfers', href: '#transfers' },
    { name: 'History', href: '#history' },
  ];

  // Scroll to selected tab
  useEffect(() => {
    const selectedTabElement = document.getElementById(`sport-tab-${selectedSport}`);
    if (selectedTabElement && tabsRef.current) {
      const container = tabsRef.current;
      const scrollLeft = selectedTabElement.offsetLeft - (container.clientWidth / 2) + (selectedTabElement.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedSport]);

  // Handle sport selection
  const handleSportSelect = (sportId: string) => {
    dispatch(uiActions.setSelectedSport(sportId));

    // Call the onSportClick callback if provided
    if (onSportClick) {
      onSportClick(sportId);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-neutral-200 fixed top-[74px] left-0 right-0 z-40 w-full">
        <div className="container mx-auto px-4">
          {!isMatchDetailsPage && (
            <div 
              ref={tabsRef}
              className="category-tabs flex overflow-x-auto py-2 space-x-6 scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = category.id === selectedSport;

              return (
                <Link 
                  key={`${category.id}-${category.name}`}
                  href={`/${category.id}`}
                  id={`sport-tab-${category.id}`}
                  className={cn(
                    "flex items-center px-1 py-1 text-sm whitespace-nowrap",
                    isActive 
                      ? "font-medium border-b-2 border-[#3182CE] text-[#3182CE]" 
                      : "text-gray-700 hover:text-gray-900"
                  )}
                  onClick={() => handleSportSelect(category.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{category.name}</span>
                </Link>
              );
            })}
          </div>
          )}
        </div>
      </div>

      
    </>
  );
};

export default SportsCategoryTabs;