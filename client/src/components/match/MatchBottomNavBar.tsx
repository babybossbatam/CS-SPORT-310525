import React, { useState } from 'react';
import { 
  MatchPageIcon, 
  LineupsIcon, 
  StatsIcon, 
  StandingsIcon 
} from '@/components/icons/MatchNavIcons';

type NavTabType = 'match' | 'lineups' | 'stats' | 'standings';

interface MatchBottomNavBarProps {
  activeTab?: NavTabType;
  onTabChange?: (tab: NavTabType) => void;
}

const MatchBottomNavBar: React.FC<MatchBottomNavBarProps> = ({ 
  activeTab = 'match',
  onTabChange 
}) => {
  const [active, setActive] = useState<NavTabType>(activeTab);

  const handleTabChange = (tab: NavTabType) => {
    setActive(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white fixed bottom-0 left-0 right-0 border-t border-gray-100">
      <button 
        className="flex flex-col items-center"
        onClick={() => handleTabChange('match')}
      >
        <MatchPageIcon className={`h-6 w-6 ${active === 'match' ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className={`text-[10px] mt-0.5 ${active === 'match' ? 'text-blue-500' : 'text-gray-400'}`}>Match Page</span>
      </button>
      
      <button 
        className="flex flex-col items-center"
        onClick={() => handleTabChange('lineups')}
      >
        <LineupsIcon className={`h-6 w-6 ${active === 'lineups' ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className={`text-[10px] mt-0.5 ${active === 'lineups' ? 'text-blue-500' : 'text-gray-400'}`}>Lineups</span>
      </button>
      
      <button 
        className="flex flex-col items-center"
        onClick={() => handleTabChange('stats')}
      >
        <StatsIcon className={`h-6 w-6 ${active === 'stats' ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className={`text-[10px] mt-0.5 ${active === 'stats' ? 'text-blue-500' : 'text-gray-400'}`}>Stats</span>
      </button>
      
      <button 
        className="flex flex-col items-center"
        onClick={() => handleTabChange('standings')}
      >
        <StandingsIcon className={`h-6 w-6 ${active === 'standings' ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className={`text-[10px] mt-0.5 ${active === 'standings' ? 'text-blue-500' : 'text-gray-400'}`}>Standings</span>
      </button>
    </div>
  );
};

export default MatchBottomNavBar;