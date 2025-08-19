import React, { Component, ErrorInfo, ReactNode, startTransition } from 'react';
import { handleNetworkRecovery } from '../../lib/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suppress certain framework and syntax errors
    const suppressPatterns = [
      'Invalid or unexpected token',
      'SyntaxError: Invalid or unexpected token',
      'Uncaught SyntaxError',
      'sandbox',
      'allow-downloads-without-user-activation',
      'allowfullscreen',
      'allowpaymentrequest',
      'plugin:runtime-error-plugin',
      'unknown runtime error',
      'runtime-error-plugin',
      'sendError',
      'riker.replit.dev',
      '482be3e5-72e0-4aaf-ab33-69660b136cf5',
      'workspace_iframe.html',
      'Unrecognized feature',
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
      'background.js',
      'extension',
      'Icon Generator',
      'Adding extension',
      'extensionArgs',
      'chrome-extension',
      'moz-extension',
      'Failed to execute \'removeChild\' on \'Node\'',
      'NotFoundError',
      'The node to be removed is not a child of this node',
      'commitDeletionEffectsOnFiber',
      'recursivelyTraverseMutationEffects',
      'commitMutationEffectsOnFiber'
    ];

    const shouldSuppress = suppressPatterns.some(pattern => 
      error.message?.includes(pattern) || 
      error.toString().includes(pattern) ||
      error.stack?.includes(pattern) ||
      errorInfo.componentStack?.includes(pattern)
    );

    if (shouldSuppress) {
      // Log but don't crash the app for these common React DOM manipulation errors
      console.warn('Suppressed DOM manipulation error:', error.message);
      return;
    }

    // Log other errors for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Report error for monitoring
    // Assuming reportError and categorizeError are defined elsewhere and available in scope
    // reportError(error, categorizeError(error), 'error-boundary'); 

    // Handle specific error types
    if (error.message.includes('Network') || 
        error.message.includes('Failed to fetch')) {
      this.handleNetworkError();
    }

    // Handle React hooks errors
    if (error.message.includes('Rendered more hooks than during the previous render') ||
        error.message.includes('Invalid hook call')) {
      console.warn('React hooks error detected - component will remount');
      // Force a clean remount by clearing component state
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isRecovering: false
        });
      }, 100);
    } else {
      // For other errors, update the state to show the error UI
      this.setState({
        hasError: true,
        error,
        errorInfo
      });
    }
  }

  handleNetworkError = async () => {
    startTransition(() => {
      this.setState({ isRecovering: true });
    });

    try {
      // Attempt network recovery
      await handleNetworkRecovery();

      // Reset error state after recovery attempt
      setTimeout(() => {
        startTransition(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            isRecovering: false
          });
        });
      }, 3000);
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      startTransition(() => {
        this.setState({ isRecovering: false });
      });
    }
  };

  handleRetry = () => {
    startTransition(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {this.state.isRecovering ? 'Recovering...' : 'Something went wrong'}
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                {this.state.isRecovering 
                  ? 'Attempting to recover from network error...'
                  : 'We apologize for the inconvenience. Please try again.'
                }
              </div>
              {this.state.error && (
                <div className="mt-2 text-xs text-gray-400 font-mono">
                  {this.state.error.message}
                </div>
              )}
              <div className="mt-4 space-x-2">
                <button 
                  onClick={this.handleRetry}
                  disabled={this.state.isRecovering}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {this.state.isRecovering ? 'Recovering...' : 'Try Again'}
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}