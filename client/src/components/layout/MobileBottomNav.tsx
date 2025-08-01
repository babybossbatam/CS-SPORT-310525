
import React from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import { RootState } from '@/lib/store';
import { 
  FootballIcon, 
  BasketballIcon, 
  TvIcon, 
  HorseRacingIcon, 
  SnookerIcon, 
  EsportsIcon 
} from '@/components/icons/SportIcons';
import { useDeviceInfo } from '@/hooks/use-mobile';

const MobileBottomNav: React.FC = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const selectedSport = useSelector((state: RootState) => state.ui.selectedSport);
  const { isMobile } = useDeviceInfo();

  if (!isMobile) return null;

  const navItems = [
    { id: 'tv', icon: TvIcon, label: 'TV', path: '/tv' },
    { id: 'football', icon: FootballIcon, label: 'Football', path: '/football' },
    { id: 'basketball', icon: BasketballIcon, label: 'Basketball', path: '/basketball' },
    { id: 'horseracing', icon: HorseRacingIcon, label: 'Racing', path: '/horseracing' },
    { id: 'snooker', icon: SnookerIcon, label: 'Snooker', path: '/snooker' },
    { id: 'esports', icon: EsportsIcon, label: 'Esports', path: '/esports' }
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    dispatch(uiActions.setSelectedSport(item.id));
    navigate(item.path);
  };

  return (
    <nav className="mobile-nav">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedSport === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
