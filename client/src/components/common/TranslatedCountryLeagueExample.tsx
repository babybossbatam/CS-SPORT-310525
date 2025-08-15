
import React from 'react';
import { 
  translateCountryName, 
  translateLeagueName,
  getTranslatedCountriesAsOptions,
  getTranslatedLeaguesAsOptions,
  getSupportedLanguages
} from '@/lib/constants/countriesAndLeagues';

interface TranslatedCountryLeagueExampleProps {
  language?: string;
}

const TranslatedCountryLeagueExample: React.FC<TranslatedCountryLeagueExampleProps> = ({ 
  language = 'en' 
}) => {
  const supportedLanguages = getSupportedLanguages();
  const translatedCountries = getTranslatedCountriesAsOptions(language);
  const translatedLeagues = getTranslatedLeaguesAsOptions(language);

  // Example usage of individual translation functions
  const exampleCountries = ['England', 'Spain', 'Germany', 'Italy', 'France'];
  const exampleLeagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Translation System Demo</h2>
      
      {/* Language selector example */}
      <div>
        <h3 className="font-semibold mb-2">Current Language: {language}</h3>
        <select 
          value={language} 
          className="p-2 border rounded"
          onChange={(e) => console.log('Language changed to:', e.target.value)}
        >
          {supportedLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Country translations example */}
      <div>
        <h3 className="font-semibold mb-2">Country Name Translations</h3>
        <div className="grid grid-cols-2 gap-4">
          {exampleCountries.map(country => (
            <div key={country} className="flex justify-between p-2 bg-gray-100 rounded">
              <span className="text-gray-600">{country}:</span>
              <span className="font-medium">{translateCountryName(country, language)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* League translations example */}
      <div>
        <h3 className="font-semibold mb-2">League Name Translations</h3>
        <div className="grid grid-cols-2 gap-4">
          {exampleLeagues.map(league => (
            <div key={league} className="flex justify-between p-2 bg-blue-100 rounded">
              <span className="text-gray-600">{league}:</span>
              <span className="font-medium">{translateLeagueName(league, language)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Country options for dropdowns */}
      <div>
        <h3 className="font-semibold mb-2">Translated Country Options (for dropdowns)</h3>
        <select className="w-full p-2 border rounded">
          <option value="">Select a country...</option>
          {translatedCountries.slice(0, 10).map(country => (
            <option key={country.value} value={country.value}>
              {country.label} {country.flag && `🏳️`}
            </option>
          ))}
        </select>
      </div>

      {/* Individual translation examples */}
      <div>
        <h3 className="font-semibold mb-2">Individual Translation Examples</h3>
        <div className="space-y-2">
          {exampleCountries.map(country => (
            <div key={country} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{country}:</span>
              <span>{translateCountryName(country, language)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* League translation examples */}
      <div>
        <h3 className="font-semibold mb-2">League Translation Examples</h3>
        <div className="space-y-2">
          {exampleLeagues.map(league => (
            <div key={league} className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span className="font-medium">{league}:</span>
              <span>{translateLeagueName(league, language)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* League options for dropdowns */}
      <div>
        <h3 className="font-semibold mb-2">Translated League Options (for dropdowns)</h3>
        <select className="w-full p-2 border rounded">
          <option value="">Select a league...</option>
          {translatedLeagues.slice(0, 10).map(league => (
            <option key={league.value} value={league.value}>
              {league.label} ({league.country})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TranslatedCountryLeagueExample;
