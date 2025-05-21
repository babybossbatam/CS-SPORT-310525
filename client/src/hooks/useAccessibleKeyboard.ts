import { useEffect, useRef, useState } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  focusOnMount?: boolean;
  tabIndex?: number;
}

/**
 * Hook to enhance keyboard accessibility in components
 * 
 * @param options Configuration options for keyboard handlers
 * @returns Keyboard event handlers and ref for the element
 */
export const useAccessibleKeyboard = (options: KeyboardNavigationOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const { 
    onEnter, 
    onEscape, 
    onSpace, 
    onArrowDown, 
    onArrowUp, 
    onArrowLeft, 
    onArrowRight,
    onTab,
    focusOnMount = false,
    tabIndex = 0
  } = options;
  
  // Focus the element on mount if specified
  useEffect(() => {
    if (focusOnMount && elementRef.current) {
      elementRef.current.focus();
    }
  }, [focusOnMount]);
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case ' ':
        if (onSpace) {
          e.preventDefault();
          onSpace();
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          e.preventDefault();
          onArrowDown();
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          e.preventDefault();
          onArrowUp();
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          e.preventDefault();
          onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          e.preventDefault();
          onArrowRight();
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab(e.shiftKey);
        }
        break;
      default:
        break;
    }
  };
  
  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  return {
    elementRef,
    isFocused,
    keyboardProps: {
      ref: elementRef,
      tabIndex,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      'aria-pressed': isFocused,
    },
  };
};

export default useAccessibleKeyboard;