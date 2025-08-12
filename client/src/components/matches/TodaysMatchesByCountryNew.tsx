import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MyCircularFlag from './MyCircularFlag'; // Assuming these components exist
import MyWorldTeamLogo from './MyWorldTeamLogo'; // Assuming these components exist
import LazyWrapper from './LazyWrapper'; // Assuming these components exist
import LazyMatchItem from './LazyMatchItem'; // Assuming these components exist

interface Fixture {
  fixture: {
    id: number;
    date: string;
    // other fixture properties
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  // other properties
}

interface CountryMatches {
  name: string;
  matches: Fixture[];
}

interface TodaysMatchesByCountryNewProps {
  allFixtures: Fixture[] | null;
  today: Date;
}

function TodaysMatchesByCountryNew({ allFixtures, today }: TodaysMatchesByCountryNewProps) {
  const [loading, setLoading] = useState(true);
  const [visibleCountries, setVisibleCountries] = useState(10);
  const [expandedCountries, setExpandedCountries] = useState(new Set());
  const [processedMatches, setProcessedMatches] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  const expandCountry = useCallback((countryName: string) => {
    setExpandedCountries(prev => new Set([...prev, countryName]));
  }, []);

  // Update loading state based on processing progress
  useEffect(() => {
    if (processingProgress === 100 && processedMatches.length > 0) {
      setLoading(false);
    } else if (!allFixtures || allFixtures.length === 0) {
      setLoading(false); // Handle case where there are no fixtures
    }
  }, [processingProgress, processedMatches, allFixtures]);


  // Split processing into smaller chunks to prevent blocking
  useEffect(() => {
    if (!allFixtures?.length) {
      setProcessedMatches([]);
      setProcessingProgress(0);
      return;
    }

    const processInChunks = async () => {
      const CHUNK_SIZE = 50; // Process 50 fixtures at a time
      const chunks = [];

      // Split fixtures into chunks
      for (let i = 0; i < allFixtures.length; i += CHUNK_SIZE) {
        chunks.push(allFixtures.slice(i, i + CHUNK_SIZE));
      }

      const processed = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Process chunk with minimal delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));

        const chunkProcessed = chunk
          .filter(fixture => {
            const fixtureDate = new Date(fixture.fixture.date);
            return fixtureDate.toDateString() === today.toDateString();
          })
          .map(fixture => ({
            ...fixture,
            // Simplified processing - defer heavy calculations
            id: fixture.fixture.id
          }));

        processed.push(...chunkProcessed);
        setProcessingProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      setProcessedMatches(processed);
    };

    processInChunks();
  }, [allFixtures, today]);

  const matchesByCountry = useMemo(() => {
    const countryMap = new Map<string, Fixture[]>();
    processedMatches.forEach(match => {
      // Assuming you have a way to get the country name from a match
      // This is a placeholder, replace with actual logic
      const countryName = match.country?.name || 'Unknown Country';
      if (!countryMap.has(countryName)) {
        countryMap.set(countryName, []);
      }
      countryMap.get(countryName)!.push(match);
    });

    return Array.from(countryMap).map(([name, matches]) => ({
      name,
      matches,
    }));
  }, [processedMatches]);

  const countries = matchesByCountry;

  return (
    <div className="todays-matches-by-country-new">
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Processing matches...</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${processingProgress}%`,
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
          <span className="progress-text">{processingProgress}%</span>
          {processingProgress > 0 && (
            <p className="progress-detail">
              Processing {Math.ceil((processingProgress / 100) * (allFixtures?.length || 0))} of {allFixtures?.length || 0} fixtures
            </p>
          )}
        </div>
      )}

      {!loading && !countries.length && (
        <p>No matches found for today.</p>
      )}

      {!loading && countries.length > 0 && (
        <div className="countries-container">
          {countries.slice(0, visibleCountries).map((country, index) => (
            <LazyWrapper
              key={country.name}
              delay={index * 100} // Stagger loading
              fallback={
                <div className="country-skeleton">
                  <div className="skeleton-flag"></div>
                  <div className="skeleton-text"></div>
                </div>
              }
            >
              <div className="country-section">
                <div className="country-header">
                  <MyCircularFlag
                    countryName={country.name}
                    size="24"
                    lazy={true}
                  />
                  <span>{country.name}</span>
                </div>
                {country.matches.slice(0, 5).map(match => (
                  <LazyMatchItem
                    key={match.fixture.id}
                    match={match}
                  />
                ))}
                {country.matches.length > 5 && (
                  <button
                    className="show-more-matches"
                    onClick={() => expandCountry(country.name)}
                  >
                    Show {country.matches.length - 5} more matches
                  </button>
                )}
              </div>
            </LazyWrapper>
          ))}

          {countries.length > visibleCountries && (
            <button
              className="load-more-countries"
              onClick={() => setVisibleCountries(prev => prev + 10)}
            >
              Load More Countries
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TodaysMatchesByCountryNew;