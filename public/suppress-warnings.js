// EventEmitter Warning Suppression Script
// This script must load before any other scripts to intercept console warnings

(function() {
  'use strict';
  
  // Store original console methods immediately
  const originalConsole = {
    warn: console.warn,
    error: console.error,
    log: console.log
  };

  // Comprehensive EventEmitter warning patterns
  const suppressionPatterns = [
    'MaxListenersExceededWarning',
    'Possible EventEmitter memory leak detected',
    'listeners added',
    'commitComplete listeners',
    'fileDirty listeners', 
    'fileClean listeners',
    'commitStart listeners',
    'promptUserReconnect listeners',
    'cursor listeners',
    'removeCursor listeners',
    'Use emitter.setMaxListeners()',
    'overrideMethod @ hook.js',
    'at d (https://cdn.replit.com',
    'at r.<anonymous> (https://cdn.replit.com',
    'at h (https://cdn.replit.com',
    'at Object.watchTextFile',
    'at Array.map (<anonymous>)',
    'at oO (https://cdn.replit.com',
    'at uB (https://cdn.replit.com'
  ];

  // Universal suppression function
  function shouldSuppress(args) {
    const message = args.join(' ');
    return suppressionPatterns.some(pattern => message.includes(pattern));
  }

  // Override console methods with suppression
  console.warn = function(...args) {
    if (shouldSuppress(args)) return;
    return originalConsole.warn.apply(console, args);
  };

  console.error = function(...args) {
    if (shouldSuppress(args)) return;
    return originalConsole.error.apply(console, args);
  };

  console.log = function(...args) {
    if (shouldSuppress(args)) return;
    return originalConsole.log.apply(console, args);
  };

  // Set global flag for other scripts
  window.__EVENTEMITTER_WARNINGS_SUPPRESSED__ = true;

  // Intercept any future console method replacements
  Object.defineProperty(console, 'warn', {
    set: function(newWarn) {
      console._originalWarn = newWarn;
    },
    get: function() {
      return function(...args) {
        if (shouldSuppress(args)) return;
        if (console._originalWarn) {
          return console._originalWarn.apply(console, args);
        }
        return originalConsole.warn.apply(console, args);
      };
    }
  });

})();