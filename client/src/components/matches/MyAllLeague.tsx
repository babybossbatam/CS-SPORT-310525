import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyAllLeagueList from './MyAllLeagueList';

interface MyAllLeagueProps {
  onMatchCardClick?: (fixture: any) => void;
}

const MyAllLeague: React.FC<MyAllLeagueProps> = ({ onMatchCardClick }) => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  return (
    <MyAllLeagueList
      selectedDate={selectedDate}
      onMatchCardClick={onMatchCardClick}
    />
  );
};

export default MyAllLeague;