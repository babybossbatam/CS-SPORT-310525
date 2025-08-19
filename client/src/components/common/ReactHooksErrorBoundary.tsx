
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError, categorizeError } from '../../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasHooksError: boolean;
  error: Error | null;
  retryCount: number;
}

export default class ReactHooksErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasHooksError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a hooks-related error
    if (error.message.includes('Rendered more hooks than during the previous render') ||
        error.message.includes('Rendered fewer hooks than expected') ||
        error.message.includes('Invalid hook call')) {
      return {
        hasHooksError: true,
        error
      };
    }
    
    // Re-throw other errors to be handled by parent error boundary
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.state.hasHooksError) {
      console.error('React Hooks Error:', error.message);
      console.error('Component Stack:', errorInfo.componentStack);
      
      reportError(error, categorizeError(error), 'react-hooks-boundary');
      
      // Auto-retry with clean state
      if (this.state.retryCount < this.maxRetries) {
        setTimeout(() => {
          this.setState(prevState => ({
            hasHooksError: false,
            error: null,
            retryCount: prevState.retryCount + 1
          }));
        }, 1000);
      }
    }
  }

  handleManualRetry = () => {
    this.setState({
      hasHooksError: false,
      error: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasHooksError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-32 flex items-center justify-center bg-red-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-red-600 font-medium mb-2">
              Component Error
            </div>
            <div className="text-sm text-red-500 mb-3">
              {this.state.retryCount < this.maxRetries 
                ? `Retrying... (${this.state.retryCount + 1}/${this.maxRetries})`
                : 'Component failed to load'
              }
            </div>
            {this.state.retryCount >= this.maxRetries && (
              <button 
                onClick={this.handleManualRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
