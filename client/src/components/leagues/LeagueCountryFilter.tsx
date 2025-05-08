import React, { useState } from 'react';
import { Globe, Flag } from 'lucide-react';

interface LeagueCountryFilterProps {
  onSelectCountry: (country: string | null) => void;
}

const LeagueCountryFilter: React.FC<LeagueCountryFilterProps> = ({ onSelectCountry }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  
  // Using flag icons instead of emoji to ensure consistent rendering
  // Reordered as: All, Europe, England, Spain, Italy, Brazil, Germany
  const countries = [
    { id: 'all', name: 'All', icon: <Globe className="h-4 w-4" /> },
    { 
      id: 'europe', 
      name: 'Europe', 
      icon: <div className="w-5 h-3 rounded-sm overflow-hidden bg-blue-600 flex items-center justify-center">
        <div className="flex flex-wrap w-3 h-3 items-center justify-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[4px] h-[4px] bg-yellow-400 m-[1px]"></div>
          ))}
        </div>
      </div>
    },
    { 
      id: 'england', 
      name: 'England', 
      icon: <div className="w-5 h-3 rounded-sm overflow-hidden bg-white flex items-center justify-center">
        <div className="w-full h-full bg-white relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[20%] bg-red-600"></div>
            <div className="absolute w-[20%] h-full bg-red-600"></div>
          </div>
        </div>
      </div>
    },
    { 
      id: 'spain', 
      name: 'Spain', 
      icon: <div className="w-5 h-3 rounded-sm overflow-hidden">
        <div className="w-full h-[25%] bg-red-600"></div>
        <div className="w-full h-[50%] bg-yellow-500"></div>
        <div className="w-full h-[25%] bg-red-600"></div>
      </div>
    },
    { 
      id: 'italy', 
      name: 'Italy', 
      icon: <div className="w-5 h-3 rounded-sm overflow-hidden flex">
        <div className="w-1/3 h-full bg-green-600"></div>
        <div className="w-1/3 h-full bg-white"></div>
        <div className="w-1/3 h-full bg-red-600"></div>
      </div>
    },
    { 
      id: 'brazil', 
      name: 'Brazil', 
      icon: <div className="w-5 h-3 rounded-sm overflow-hidden bg-green-500 flex items-center justify-center">
        <div className="w-4 h-2 transform rotate-6 bg-yellow-400"></div>
        <div className="absolute w-2 h-2 rounded-full bg-blue-700 flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-white"></div>
        </div>
      </div>
    },
    { 
      id: 'germany', 
      name: 'Germany', 
      icon: <div className="w-5 h-3 rounded-sm overflow-hidden flex flex-col">
        <div className="w-full h-1/3 bg-black"></div>
        <div className="w-full h-1/3 bg-red-600"></div>
        <div className="w-full h-1/3 bg-yellow-400"></div>
      </div>
    },
  ];
  
  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);
    onSelectCountry(country);
  };
  
  return (
    <div className="p-3 border-b">
      <h2 className="text-base font-bold mb-2">Popular Football Leagues</h2>
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {countries.map((country) => {
          const isSelected = selectedCountry === country.id || (selectedCountry === null && country.id === 'all');
          const isHovered = hoveredCountry === country.id;
          
          return (
            <button
              key={country.id}
              onClick={() => handleCountrySelect(country.id === 'all' ? null : country.id)}
              onMouseEnter={() => setHoveredCountry(country.id)}
              onMouseLeave={() => setHoveredCountry(null)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              } ${isHovered ? 'scale-105 shadow-lg' : ''}`}
            >
              <span className={`transition-transform duration-300 ${isHovered ? 'rotate-12 scale-110' : ''}`}>
                {country.icon}
              </span>
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