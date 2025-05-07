import React, { useState } from 'react';
import { Globe, Flag } from 'lucide-react';

interface LeagueCountryFilterProps {
  onSelectCountry: (country: string | null) => void;
}

const LeagueCountryFilter: React.FC<LeagueCountryFilterProps> = ({ onSelectCountry }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  const countries = [
    { id: 'all', name: 'All', icon: <Globe className="h-4 w-4" /> },
    { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'italy', name: 'Italy', flag: '🇮🇹' },
    { id: 'europe', name: 'Europe', flag: '🇪🇺' },
    { id: 'brazil', name: 'Brazil', flag: '🇧🇷' },
    { id: 'spain', name: 'Spain', flag: '🇪🇸' },
    { id: 'germany', name: 'Germany', flag: '🇩🇪' },
  ];
  
  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);
    onSelectCountry(country);
  };
  
  return (
    <div className="p-3 border-b">
      <h2 className="text-base font-bold mb-2">Popular Football Leagues</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {countries.map((country) => (
          <button
            key={country.id}
            onClick={() => handleCountrySelect(country.id === 'all' ? null : country.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              (selectedCountry === country.id || (selectedCountry === null && country.id === 'all'))
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {country.icon || <span className="text-base">{country.flag}</span>}
            <span>{country.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LeagueCountryFilter;