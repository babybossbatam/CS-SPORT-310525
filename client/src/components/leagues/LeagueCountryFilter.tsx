import React, { useState } from 'react';
import { Globe } from 'lucide-react';

interface LeagueCountryFilterProps {
  onSelectCountry: (country: string | null) => void;
}

const LeagueCountryFilter: React.FC<LeagueCountryFilterProps> = ({ onSelectCountry }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  
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
        {countries.map((country) => {
          const isSelected = selectedCountry === country.id || (selectedCountry === null && country.id === 'all');
          const isHovered = hoveredCountry === country.id;
          
          return (
            <button
              key={country.id}
              onClick={() => handleCountrySelect(country.id === 'all' ? null : country.id)}
              onMouseEnter={() => setHoveredCountry(country.id)}
              onMouseLeave={() => setHoveredCountry(null)}
              className={`relative flex items-center gap-1 px-3 py-1 rounded-full text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              } ${isHovered ? 'scale-105 shadow-lg' : ''}`}
            >
              {country.icon ? (
                <span className={`transition-transform duration-300 ${isHovered ? 'rotate-12 scale-110' : ''}`}>
                  {country.icon}
                </span>
              ) : (
                <span 
                  className={`text-lg mr-1 inline-block transition-all duration-300 ${
                    isHovered ? 'animate-pulse scale-125' : ''
                  }`}
                >
                  {country.flag}
                </span>
              )}
              <span className={`transition-all duration-300 ${isHovered ? 'font-semibold' : ''}`}>{country.name}</span>
              
              {/* Animated background effect when hovered */}
              {isHovered && !isSelected && (
                <span 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine"
                  style={{ 
                    transform: 'skewX(-20deg)',
                    backgroundSize: '200% 100%',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LeagueCountryFilter;