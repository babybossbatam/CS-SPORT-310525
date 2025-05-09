import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accessibility } from 'lucide-react';

const AccessibilityPanel = () => {
  const dispatch = useDispatch();
  const { accessibility } = useSelector((state: RootState) => state.ui);
  const [isOpen, setIsOpen] = useState(false);

  const toggleHighContrast = () => {
    dispatch(uiActions.toggleHighContrast());
  };

  const toggleLargerText = () => {
    dispatch(uiActions.toggleLargerText());
  };

  const toggleReducedAnimations = () => {
    dispatch(uiActions.toggleReducedAnimations());
  };

  const resetSettings = () => {
    dispatch(uiActions.resetAccessibility());
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={`fixed bottom-4 right-4 z-50 rounded-full shadow-lg ${
            accessibility.highContrast ? 'bg-black text-white border-white border-2' : ''
          }`}
          aria-label="Accessibility options"
        >
          <Accessibility 
            className={`h-5 w-5 ${accessibility.highContrast ? 'text-white' : ''}`} 
          />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className={`w-80 p-4 ${accessibility.highContrast ? 'bg-black text-white border-white' : ''}`}
        side="top"
      >
        <div className="space-y-4">
          <h3 className={`font-bold text-lg mb-2 ${accessibility.largerText ? 'text-xl' : ''}`}>
            Accessibility Settings
          </h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast" className={`${accessibility.largerText ? 'text-lg' : ''}`}>
              High contrast mode
            </Label>
            <Switch 
              id="high-contrast" 
              checked={accessibility.highContrast} 
              onCheckedChange={toggleHighContrast}
              className={accessibility.highContrast ? 'bg-white data-[state=checked]:bg-blue-500' : ''}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="larger-text" className={`${accessibility.largerText ? 'text-lg' : ''}`}>
              Larger text
            </Label>
            <Switch 
              id="larger-text" 
              checked={accessibility.largerText}
              onCheckedChange={toggleLargerText}
              className={accessibility.highContrast ? 'bg-white data-[state=checked]:bg-blue-500' : ''}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-animations" className={`${accessibility.largerText ? 'text-lg' : ''}`}>
              Reduced animations
            </Label>
            <Switch 
              id="reduced-animations" 
              checked={accessibility.reducedAnimations}
              onCheckedChange={toggleReducedAnimations}
              className={accessibility.highContrast ? 'bg-white data-[state=checked]:bg-blue-500' : ''}
            />
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSettings}
              className={`
                ${accessibility.highContrast ? 'bg-black text-white border-white hover:bg-gray-800' : ''}
                ${accessibility.largerText ? 'text-lg p-5' : ''}
                ${accessibility.reducedAnimations ? 'transition-none' : ''}
              `}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilityPanel;