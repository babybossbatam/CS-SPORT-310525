
(function() {
  'use strict';
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Define patterns to suppress
  const suppressPatterns = [
    'MaxListenersExceededWarning',
    'Possible EventEmitter memory leak',
    'listeners added',
    'Use emitter.setMaxListeners()',
    'Invalid or unexpected token',
    'SyntaxError: Invalid or unexpected token',
    'Uncaught SyntaxError',
    'sandbox',
    'allow-downloads-without-user-activation',
    'Unrecognized feature',
    'Allow attribute will take precedence',
    'allowfullscreen',
    'allowpaymentrequest',
    'ambient-light-sensor',
    'battery',
    'execution-while-not-rendered',
    'execution-while-out-of-viewport',
    'layout-animations',
    'legacy-image-formats',
    'navigation-override',
    'oversized-images',
    'publickey-credentials',
    'speaker-selection',
    'unoptimized-images',
    'unsized-media',
    'pointer-lock',
    'commitComplete listeners',
    'fileDirty listeners',
    'fileClean listeners',
    'overrideMethod @ hook.js',
    'background.js',
    'framework-'
  ];
  
  // Override console.error
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      return; // Suppress
    }
    
    return originalError.apply(console, args);
  };
  
  // Override console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      return; // Suppress
    }
    
    return originalWarn.apply(console, args);
  };
  
  // Handle uncaught errors
  window.addEventListener('error', function(event) {
    if (suppressPatterns.some(pattern => 
      event.message?.includes(pattern) || 
      event.error?.message?.includes(pattern)
    )) {
      event.preventDefault();
      return false;
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (suppressPatterns.some(pattern => 
      event.reason?.message?.includes(pattern) || 
      String(event.reason).includes(pattern)
    )) {
      event.preventDefault();
      return false;
    }
  });
})();
