import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleScreenReaderMode: () => void;
  resetSettings: () => void;
}

const defaultContext: AccessibilityContextType = {
  highContrast: false,
  largeText: false,
  screenReaderMode: false,
  toggleHighContrast: () => {},
  toggleLargeText: () => {},
  toggleScreenReaderMode: () => {},
  resetSettings: () => {},
};

const AccessibilityContext = createContext<AccessibilityContextType>(defaultContext);

export const useAccessibility = () => useContext(AccessibilityContext);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    screenReaderMode: false,
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      applySettings(parsedSettings);
    }
  }, []);

  // Apply settings to the DOM
  const applySettings = (currentSettings: typeof settings) => {
    // Apply high contrast mode
    if (currentSettings.highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }

    // Apply large text mode
    if (currentSettings.largeText) {
      document.body.classList.add('large-text-mode');
    } else {
      document.body.classList.remove('large-text-mode');
    }

    // Apply screen reader optimizations
    if (currentSettings.screenReaderMode) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }

    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(currentSettings));
  };

  // Toggle functions for each setting
  const toggleHighContrast = () => {
    setSettings(prev => {
      const newSettings = { ...prev, highContrast: !prev.highContrast };
      applySettings(newSettings);
      return newSettings;
    });
  };

  const toggleLargeText = () => {
    setSettings(prev => {
      const newSettings = { ...prev, largeText: !prev.largeText };
      applySettings(newSettings);
      return newSettings;
    });
  };

  const toggleScreenReaderMode = () => {
    setSettings(prev => {
      const newSettings = { ...prev, screenReaderMode: !prev.screenReaderMode };
      applySettings(newSettings);
      return newSettings;
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      highContrast: false,
      largeText: false,
      screenReaderMode: false,
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        toggleHighContrast,
        toggleLargeText,
        toggleScreenReaderMode,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext;