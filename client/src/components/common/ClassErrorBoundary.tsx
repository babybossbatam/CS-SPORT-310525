import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{ 
    error: Error | null; 
    resetErrorBoundary: () => void;
  }>;
  onReset?: () => void;
  onError?: (error: Error, info: ErrorInfo) => void;
  errorMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ClassErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by error boundary:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetErrorBoundary={this.resetErrorBoundary} 
          />
        );
      }
      
      // Use our default ErrorFallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          errorMessage={this.props.errorMessage}
        />
      );
    }

    return this.props.children;
  }
}

export default ClassErrorBoundary;