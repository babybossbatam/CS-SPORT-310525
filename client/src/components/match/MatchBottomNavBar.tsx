import React, { useState } from 'react';
import { MatchPageIcon, LineupsIcon, StatsIcon, StandingsIcon } from '../icons/MatchNavIcons';

export type MatchTab = 'match' | 'lineups' | 'stats' | 'standings';

interface MatchBottomNavBarProps {
  activeTab: MatchTab;
  onTabChange: (tab: MatchTab) => void;
}

export function MatchBottomNavBar({ activeTab, onTabChange }: MatchBottomNavBarProps) {
  const activeColor = "#15222A";
  const inactiveColor = "#6B7173";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 z-50">
      <button
        className={`flex flex-col items-center justify-center py-2 px-4 ${activeTab === 'match' ? 'text-[#15222A]' : 'text-[#6B7173]'}`}
        onClick={() => onTabChange('match')}
      >
        <MatchPageIcon size={22} color={activeTab === 'match' ? activeColor : inactiveColor} />
        <span className="text-xs mt-1 font-medium">Match</span>
      </button>
      
      <button
        className={`flex flex-col items-center justify-center py-2 px-4 ${activeTab === 'lineups' ? 'text-[#15222A]' : 'text-[#6B7173]'}`}
        onClick={() => onTabChange('lineups')}
      >
        <LineupsIcon size={22} color={activeTab === 'lineups' ? activeColor : inactiveColor} />
        <span className="text-xs mt-1 font-medium">Lineups</span>
      </button>
      
      <button
        className={`flex flex-col items-center justify-center py-2 px-4 ${activeTab === 'stats' ? 'text-[#15222A]' : 'text-[#6B7173]'}`}
        onClick={() => onTabChange('stats')}
      >
        <StatsIcon size={22} color={activeTab === 'stats' ? activeColor : inactiveColor} />
        <span className="text-xs mt-1 font-medium">Stats</span>
      </button>
      
      <button
        className={`flex flex-col items-center justify-center py-2 px-4 ${activeTab === 'standings' ? 'text-[#15222A]' : 'text-[#6B7173]'}`}
        onClick={() => onTabChange('standings')}
      >
        <StandingsIcon size={22} color={activeTab === 'standings' ? activeColor : inactiveColor} />
        <span className="text-xs mt-1 font-medium">Standings</span>
      </button>
    </div>
  );
}