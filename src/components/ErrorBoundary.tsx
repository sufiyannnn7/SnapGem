import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-medium mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            We encountered an unexpected error while loading this page. Our team has been notified.
          </p>
          
          <div className="bg-secondary/50 p-4 rounded-lg text-left max-w-2xl w-full mb-8 overflow-auto">
            <p className="font-mono text-sm text-destructive font-medium mb-2">{this.state.error?.message}</p>
            <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
              {this.state.error?.stack}
            </pre>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 border border-border px-6 py-2 rounded-full font-medium hover:bg-secondary transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
