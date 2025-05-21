import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX 
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
}

// This helps persist the settings between page refreshes
const saveSettings = (settings: AccessibilitySettings) => {
  localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  
  // Apply settings to document body as data attributes
  document.body.dataset.highContrast = settings.highContrast.toString();
  document.body.dataset.largeText = settings.largeText.toString();
  document.body.dataset.screenReader = settings.screenReaderMode.toString();
  
  // Add or remove accessibility class to body for CSS styling
  if (settings.highContrast) {
    document.body.classList.add('high-contrast-mode');
  } else {
    document.body.classList.remove('high-contrast-mode');
  }
  
  if (settings.largeText) {
    document.body.classList.add('large-text-mode');
  } else {
    document.body.classList.remove('large-text-mode');
  }
  
  if (settings.screenReaderMode) {
    document.body.classList.add('screen-reader-mode');
  } else {
    document.body.classList.remove('screen-reader-mode');
  }
};

// Load settings from localStorage
const loadSettings = (): AccessibilitySettings => {
  const savedSettings = localStorage.getItem('accessibility-settings');
  if (savedSettings) {
    return JSON.parse(savedSettings);
  }
  return {
    highContrast: false,
    largeText: false,
    screenReaderMode: false
  };
};

const AccessibilityToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings());

  useEffect(() => {
    // Apply settings on component mount
    saveSettings(settings);
    
    // Add keyboard shortcut for accessibility menu (Alt+A)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'a') {
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update settings and save to localStorage
  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Announce change to screen readers
    announceChange(`${key} is now ${value ? 'enabled' : 'disabled'}`);
  };

  // Helper function to announce changes to screen readers
  const announceChange = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement is read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
  };

  return (
    <div className="accessibility-controls">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="accessibility-toggle-button"
        aria-label="Accessibility options"
        aria-expanded={isOpen}
        title="Accessibility Options (Alt+A)"
      >
        <Eye className="h-5 w-5" />
        <span className="sr-only">Accessibility Options</span>
      </Button>

      {isOpen && (
        <div 
          className="accessibility-panel" 
          role="dialog" 
          aria-label="Accessibility Settings"
        >
          <h3 className="text-lg font-medium mb-4">Accessibility Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <Label htmlFor="high-contrast">High Contrast</Label>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                aria-label="Toggle high contrast mode"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="large-text">Large Text</Label>
              </div>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
                aria-label="Toggle large text mode"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Label htmlFor="screen-reader">Screen Reader Optimizations</Label>
              </div>
              <Switch
                id="screen-reader"
                checked={settings.screenReaderMode}
                onCheckedChange={(checked) => updateSetting('screenReaderMode', checked)}
                aria-label="Toggle screen reader optimizations"
              />
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            Press Alt+A to toggle this panel
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToggle;