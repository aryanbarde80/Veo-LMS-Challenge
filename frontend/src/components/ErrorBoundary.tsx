import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Error Boundary]', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] to-[#1A1A2E] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="bg-[#16213E] border border-[#FF6B35]/30 rounded-2xl p-8 text-center">
                <div className="flex justify-center mb-4">
                  <AlertCircle className="w-16 h-16 text-[#FF6B35]" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-[#9B98B8] mb-6">
                  {this.state.error?.message ||
                    'An unexpected error occurred. Please try again.'}
                </p>
                <button
                  onClick={this.reset}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
