
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  translations: { [key: string]: { [key: string]: string } };
}

const translations = {
  'en': {
    'today_matches': "Today's Matches",
    'yesterday_matches': "Yesterday's Matches",
    'tomorrow_matches': "Tomorrow's Matches",
    'live_matches': "Live Matches",
    'football_leagues': "Football Leagues",
    'all_leagues': "All Leagues A-Z",
    'standings': "Standings",
    'fixtures': "Fixtures",
    'results': "Results",
    'statistics': "Statistics",
    'home': "Home",
    'away': "Away",
    'vs': "vs",
    'football': "Football",
    'basketball': "Basketball",
    'settings': "Settings",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Not Started",
    'myScores': "My Scores"
  },
  'es': {
    'today_matches': "Partidos de Hoy",
    'yesterday_matches': "Partidos de Ayer",
    'tomorrow_matches': "Partidos de Mañana",
    'live_matches': "Partidos en Vivo",
    'football_leagues': "Ligas de Fútbol",
    'all_leagues': "Todas las Ligas A-Z",
    'standings': "Clasificación",
    'fixtures': "Calendario",
    'results': "Resultados",
    'statistics': "Estadísticas",
    'home': "Local",
    'away': "Visitante",
    'vs': "vs",
    'football': "Fútbol",
    'basketball': "Baloncesto",
    'settings': "Configuración",
    'live': "VIVO",
    'finished': "FT",
    'not_started': "No Iniciado",
    'myScores': "Mis Puntuaciones"
  },
  'fr': {
    'today_matches': "Matchs d'Aujourd'hui",
    'yesterday_matches': "Matchs d'Hier",
    'tomorrow_matches': "Matchs de Demain",
    'live_matches': "Matchs en Direct",
    'football_leagues': "Ligues de Football",
    'all_leagues': "Toutes les Ligues A-Z",
    'standings': "Classement",
    'fixtures': "Calendrier",
    'results': "Résultats",
    'statistics': "Statistiques",
    'home': "Domicile",
    'away': "Extérieur",
    'vs': "vs",
    'football': "Football",
    'basketball': "Basketball",
    'settings': "Paramètres",
    'live': "DIRECT",
    'finished': "FT",
    'not_started': "Pas Commencé",
    'myScores': "Mes Scores"
  },
  'de': {
    'today_matches': "Heutige Spiele",
    'yesterday_matches': "Gestrige Spiele",
    'tomorrow_matches': "Morgige Spiele",
    'live_matches': "Live Spiele",
    'football_leagues': "Fußball Ligen",
    'all_leagues': "Alle Ligen A-Z",
    'standings': "Tabelle",
    'fixtures': "Spielplan",
    'results': "Ergebnisse",
    'statistics': "Statistiken",
    'home': "Heim",
    'away': "Auswärts",
    'vs': "vs",
    'football': "Fußball",
    'basketball': "Basketball",
    'settings': "Einstellungen",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Nicht Gestartet",
    'myScores': "Meine Ergebnisse"
  },
  'it': {
    'today_matches': "Partite di Oggi",
    'yesterday_matches': "Partite di Ieri",
    'tomorrow_matches': "Partite di Domani",
    'live_matches': "Partite in Diretta",
    'football_leagues': "Campionati di Calcio",
    'all_leagues': "Tutti i Campionati A-Z",
    'standings': "Classifica",
    'fixtures': "Calendario",
    'results': "Risultati",
    'statistics': "Statistiche",
    'home': "Casa",
    'away': "Trasferta",
    'vs': "vs",
    'football': "Calcio",
    'basketball': "Pallacanestro",
    'settings': "Impostazioni",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Non Iniziato",
    'myScores': "I Miei Punteggi"
  },
  'pt': {
    'today_matches': "Jogos de Hoje",
    'yesterday_matches': "Jogos de Ontem",
    'tomorrow_matches': "Jogos de Amanhã",
    'live_matches': "Jogos ao Vivo",
    'football_leagues': "Ligas de Futebol",
    'all_leagues': "Todas as Ligas A-Z",
    'standings': "Classificação",
    'fixtures': "Calendário",
    'results': "Resultados",
    'statistics': "Estatísticas",
    'home': "Casa",
    'away': "Fora",
    'vs': "vs",
    'football': "Futebol",
    'basketball': "Basquetebol",
    'settings': "Configurações",
    'live': "AO VIVO",
    'finished': "FT",
    'not_started': "Não Iniciado",
    'myScores': "Meus Resultados"
  }
};

const countryToLanguageMap: { [key: string]: string } = {
  'United States': 'en',
  'United Kingdom': 'en',
  'Spain': 'es',
  'France': 'fr',
  'Germany': 'de',
  'Italy': 'it',
  'Portugal': 'pt',
  'Brazil': 'pt',
  'Mexico': 'es',
  'Argentina': 'es'
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (language: string) => {
    if (translations[language]) {
      setCurrentLanguage(language);
      localStorage.setItem('app-language', language);
    }
  };

  const setLanguageByCountry = (countryName: string) => {
    const language = countryToLanguageMap[countryName];
    if (language) {
      setLanguage(language);
    }
  };

  const contextValue = {
    currentLanguage,
    setLanguage,
    setLanguageByCountry,
    translations
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { currentLanguage, translations } = useLanguage();
  
  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  return { t };
};

export { countryToLanguageMap };
