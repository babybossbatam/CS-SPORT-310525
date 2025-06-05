
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import CustomCountryFlag, { getAllSupportedCountries, hasCustomFlag } from '../components/common/CustomCountryFlags';
import { exportAllCountryFlags, exportSingleCountryFlag, getCountryFlagDataURL, getSupportedCountries } from '../lib/flagExporter';
import { countryCodeMap } from '../lib/flagUtils';

const FlagGenerator: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  // Get all countries from the country code map
  const allCountries = Object.keys(countryCodeMap);
  const customFlagCountries = getAllSupportedCountries();
  
  // Filter countries based on search term
  const filteredCountries = allCountries.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadAll = () => {
    exportAllCountryFlags();
  };

  const handleDownloadSingle = (country: string) => {
    exportSingleCountryFlag(country);
  };

  const handlePreviewCountry = (country: string) => {
    setSelectedCountry(country);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Custom SVG Flag Generator</h1>
        <p className="text-gray-600">
          Generate and download custom SVG flags for all world countries based on your design template
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={handleDownloadAll} variant="default">
              Download All Flags ({allCountries.length})
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>• Total countries: {allCountries.length}</p>
            <p>• Custom designed: {customFlagCountries.length}</p>
            <p>• Auto-generated: {allCountries.length - customFlagCountries.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Selected Country Preview */}
      {selectedCountry && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {selectedCountry}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <CustomCountryFlag country={selectedCountry} size={128} />
              <div className="space-y-2">
                <p className="font-medium">{selectedCountry}</p>
                <p className="text-sm text-gray-600">
                  {hasCustomFlag(selectedCountry) ? 'Custom designed flag' : 'Auto-generated flag'}
                </p>
                <Button onClick={() => handleDownloadSingle(selectedCountry)}>
                  Download SVG
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Country Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Countries ({filteredCountries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {filteredCountries.map((country) => (
              <div 
                key={country} 
                className="text-center space-y-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handlePreviewCountry(country)}
              >
                <CustomCountryFlag country={country} size={48} />
                <div className="text-xs font-medium truncate" title={country}>
                  {country}
                </div>
                <div className="text-xs text-gray-500">
                  {hasCustomFlag(country) ? '🎨' : '🤖'}
                </div>
              </div>
            ))}
          </div>
          
          {filteredCountries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No countries found matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">In Your Components:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import CustomCountryFlag from './CustomCountryFlags';

// Use in your component
<CustomCountryFlag 
  country="Brazil" 
  size={36} 
  className="team-logo" 
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Replace LazyImage:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Instead of:
<LazyImage src={flagUrl} alt={country} />

// Use:
<CustomCountryFlag country={country} size={36} />`}
              </pre>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Features:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
              <li>🎨 Custom designed flags for major countries with authentic colors</li>
              <li>🤖 Auto-generated flags for all other countries using your template</li>
              <li>📱 Fully responsive and scalable SVG format</li>
              <li>✨ Glossy effect and consistent design pattern</li>
              <li>🔄 No external API dependencies - all flags are self-contained</li>
              <li>💾 Downloadable SVG files for offline use</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlagGenerator;
