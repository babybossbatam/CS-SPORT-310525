
import React, { useState } from 'react';
import { 
  getTranslatedLeaguesAsOptions,
  getTranslatedCountriesAsOptions,
  getSupportedLanguages,
  translateLeagueName,
  translateCountryName 
} from '@/lib/constants/countriesAndLeagues';

interface TranslatedLeagueSelectorProps {
  selectedLanguage?: string;
  onLeagueSelect?: (leagueId: number, leagueName: string) => void;
  onCountrySelect?: (countryCode: string, countryName: string) => void;
}

const TranslatedLeagueSelector: React.FC<TranslatedLeagueSelectorProps> = ({
  selectedLanguage = 'en',
  onLeagueSelect,
  onCountrySelect
}) => {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Get translated options
  const translatedCountries = getTranslatedCountriesAsOptions(selectedLanguage);
  const translatedLeagues = getTranslatedLeaguesAsOptions(selectedLanguage);
  const supportedLanguages = getSupportedLanguages();

  const handleLeagueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = parseInt(event.target.value);
    const selectedOption = translatedLeagues.find(league => league.value === leagueId);
    
    if (selectedOption) {
      setSelectedLeague(leagueId);
      onLeagueSelect?.(leagueId, selectedOption.label);
    }
  };

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value;
    const selectedOption = translatedCountries.find(country => country.value === countryCode);
    
    if (selectedOption) {
      setSelectedCountry(countryCode);
      onCountrySelect?.(countryCode, selectedOption.label);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">
        {selectedLanguage === 'zh' ? '选择联赛和国家' : 
         selectedLanguage === 'es' ? 'Seleccionar Liga y País' : 
         'Select League and Country'}
      </h3>
      
      {/* Language Display */}
      <div className="text-sm text-gray-600">
        Current Language: {supportedLanguages.find(lang => lang.code === selectedLanguage)?.name}
      </div>

      {/* Country Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {translateCountryName('Country', selectedLanguage) || 'Country'}:
        </label>
        <select 
          value={selectedCountry || ''} 
          onChange={handleCountryChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">
            {selectedLanguage === 'zh' ? '选择国家...' : 
             selectedLanguage === 'es' ? 'Seleccionar país...' : 
             'Select a country...'}
          </option>
          {translatedCountries.slice(0, 20).map(country => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>
      </div>

      {/* League Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {selectedLanguage === 'zh' ? '联赛' : 
           selectedLanguage === 'es' ? 'Liga' : 
           'League'}:
        </label>
        <select 
          value={selectedLeague || ''} 
          onChange={handleLeagueChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">
            {selectedLanguage === 'zh' ? '选择联赛...' : 
             selectedLanguage === 'es' ? 'Seleccionar liga...' : 
             'Select a league...'}
          </option>
          {translatedLeagues.slice(0, 15).map(league => (
            <option key={league.value} value={league.value}>
              {league.label} ({league.country})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Information Display */}
      {(selectedLeague || selectedCountry) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">
            {selectedLanguage === 'zh' ? '已选择:' : 
             selectedLanguage === 'es' ? 'Seleccionado:' : 
             'Selected:'}
          </h4>
          {selectedCountry && (
            <p className="text-sm">
              {selectedLanguage === 'zh' ? '国家: ' : 
               selectedLanguage === 'es' ? 'País: ' : 
               'Country: '}
              {translatedCountries.find(c => c.value === selectedCountry)?.label}
            </p>
          )}
          {selectedLeague && (
            <p className="text-sm">
              {selectedLanguage === 'zh' ? '联赛: ' : 
               selectedLanguage === 'es' ? 'Liga: ' : 
               'League: '}
              {translatedLeagues.find(l => l.value === selectedLeague)?.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslatedLeagueSelector;
