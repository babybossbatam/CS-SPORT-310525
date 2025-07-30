// Explicitly excluded leagues
const EXPLICITLY_EXCLUDED_LEAGUE_IDS = [848, 169, 940, 85, 80, 84, 87, 41, 86]; // UEFA Europa Conference League, Regionalliga - Bayern, League 940, Regionalliga - Nordost, 3. Liga, Regionalliga - Nord, Regionalliga - West, League One England, Regionalliga - SudWest

if (fixture.league.id === 41) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] League One England match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 86) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - SudWest match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }