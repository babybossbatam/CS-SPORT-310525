
import React, { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import MyWorldTeamLogo from '../common/MyWorldTeamLogo';
import MyCountryGroupFlag from '../common/MyCountryGroupFlag';
import { Star } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

interface VirtualizedMatchListProps {
  matches: any[];
  height: number;
  onMatchClick?: (fixture: any) => void;
  favoriteTeams: Set<number>;
  toggleFavoriteTeam: (teamId: number) => void;
}

const MATCH_ITEM_HEIGHT = 80;

const MatchItem = memo(({ index, style, data }: any) => {
  const { matches, onMatchClick, favoriteTeams, toggleFavoriteTeam } = data;
  const fixture = matches[index];

  const handleMatchClick = useCallback(() => {
    onMatchClick?.(fixture);
  }, [fixture, onMatchClick]);

  const handleStarClick = useCallback((e: React.MouseEvent, teamId: number) => {
    e.stopPropagation();
    toggleFavoriteTeam(teamId);
  }, [toggleFavoriteTeam]);

  // Format match time
  const formatMatchTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'HH:mm') : '--:--';
    } catch {
      return '--:--';
    }
  };

  // Get match status display
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const elapsed = fixture.fixture.status.elapsed;

    switch (status) {
      case 'NS':
        return formatMatchTime(fixture.fixture.date);
      case 'LIVE':
      case '1H':
      case '2H':
        return elapsed ? `${elapsed}'` : 'LIVE';
      case 'HT':
        return 'HT';
      case 'FT':
        return 'FT';
      case 'ET':
        return 'ET';
      case 'PEN':
        return 'PEN';
      default:
        return status;
    }
  };

  const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
    fixture.fixture.status.short
  );

  return (
    <div style={style} className="country-matches-container">
      <div
        className="match-card-container"
        onClick={handleMatchClick}
      >
        {/* Star button */}
        <button
          className="match-star-button"
          onClick={(e) => handleStarClick(e, fixture.teams.home.id)}
          aria-label="Add to favorites"
        >
          <Star 
            className={`match-star-icon ${
              favoriteTeams.has(fixture.teams.home.id) ? 'starred' : ''
            }`}
          />
        </button>

        {/* Three-grid layout container */}
        <div className="match-three-grid-container">
          {/* Top grid - Match status */}
          <div className="match-status-top">
            <span className={`match-status-label ${
              isLive ? 'status-live-elapsed' : 
              fixture.fixture.status.short === 'FT' ? 'status-ended' :
              fixture.fixture.status.short === 'PST' ? 'status-postponed' : 'status-upcoming'
            }`}>
              {getMatchStatus(fixture)}
            </span>
          </div>

          {/* Middle grid - Main match content */}
          <div className="match-content-container">
            {/* Home team name */}
            <div className={`home-team-name ${
              fixture.goals.home !== null && fixture.goals.away !== null &&
              fixture.goals.home > fixture.goals.away ? 'winner' : ''
            }`}>
              {fixture.teams.home.name}
            </div>

            {/* Home team logo */}
            <div className="home-team-logo-container">
              <MyWorldTeamLogo
                teamId={fixture.teams.home.id}
                teamName={fixture.teams.home.name}
                logoUrl={fixture.teams.home.logo}
                size={34}
                loading="lazy"
              />
            </div>

            {/* Score/Time center container */}
            <div className="match-score-container">
              {fixture.goals.home !== null && fixture.goals.away !== null ? (
                <div className="match-score-display">
                  <span className="score-number">{fixture.goals.home}</span>
                  <span className="score-separator">-</span>
                  <span className="score-number">{fixture.goals.away}</span>
                </div>
              ) : (
                <div className="match-time-display">
                  {formatMatchTime(fixture.fixture.date)}
                </div>
              )}
            </div>

            {/* Away team logo */}
            <div className="away-team-logo-container">
              <MyWorldTeamLogo
                teamId={fixture.teams.away.id}
                teamName={fixture.teams.away.name}
                logoUrl={fixture.teams.away.logo}
                size={34}
                loading="lazy"
              />
            </div>

            {/* Away team name */}
            <div className={`away-team-name ${
              fixture.goals.home !== null && fixture.goals.away !== null &&
              fixture.goals.away > fixture.goals.home ? 'winner' : ''
            }`}>
              {fixture.teams.away.name}
            </div>
          </div>

          {/* Bottom grid - Penalty results (if any) */}
          <div className="match-penalty-bottom">
            {fixture.score?.penalty?.home !== null && 
             fixture.score?.penalty?.away !== null && (
              <div className="penalty-result-display">
                <div className="penalty-text">
                  Penalties: {fixture.score.penalty.home} - {fixture.score.penalty.away}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const VirtualizedMatchList: React.FC<VirtualizedMatchListProps> = memo(({
  matches,
  height,
  onMatchClick,
  favoriteTeams,
  toggleFavoriteTeam
}) => {
  const itemData = {
    matches,
    onMatchClick,
    favoriteTeams,
    toggleFavoriteTeam
  };

  if (matches.length === 0) {
    return <div className="text-center py-4 text-gray-500">No matches found</div>;
  }

  // Use virtualization only for large lists (>20 matches)
  if (matches.length <= 20) {
    return (
      <div className="space-y-0">
        {matches.map((match, index) => (
          <MatchItem
            key={match.fixture.id}
            index={index}
            style={{ height: MATCH_ITEM_HEIGHT }}
            data={itemData}
          />
        ))}
      </div>
    );
  }

  return (
    <List
      height={Math.min(matches.length * MATCH_ITEM_HEIGHT, height)}
      itemCount={matches.length}
      itemSize={MATCH_ITEM_HEIGHT}
      itemData={itemData}
      width="100%"
      style={{ background: 'inherit' }}
    >
      {MatchItem}
    </List>
  );
});

export default VirtualizedMatchList;
