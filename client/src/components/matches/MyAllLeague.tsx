
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyAllLeagueList from './MyAllLeagueList';
import MyCountryGroupFlag from '../common/MyCountryGroupFlag';

const MyAllLeague: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  return (
    <MyAllLeagueList selectedDate={selectedDate} />
  );
};

export default MyAllLeague;
