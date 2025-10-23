import { createContext, useContext, ReactNode } from 'react';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

interface InactivityContextType {
  isInactive: boolean;
  pauseRefetching: boolean;
  resetTimer: () => void;
  getTimeSinceLastActivity: () => number;
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined);

interface InactivityProviderProps {
  children: ReactNode;
}

export const InactivityProvider = ({ children }: InactivityProviderProps) => {
  const { isInactive, resetTimer, getTimeSinceLastActivity } = useInactivityTimeout({
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    enableLogging: true,
  });

  const value: InactivityContextType = {
    isInactive,
    pauseRefetching: isInactive,
    resetTimer,
    getTimeSinceLastActivity,
  };

  return (
    <InactivityContext.Provider value={value}>
      {children}
    </InactivityContext.Provider>
  );
};

export const useInactivity = () => {
  const context = useContext(InactivityContext);
  if (context === undefined) {
    throw new Error('useInactivity must be used within an InactivityProvider');
  }
  return context;
};
