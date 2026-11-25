import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class VendorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VendorErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center space-y-4 my-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172B29]">
              {this.props.fallbackTitle || 'Unable to display this view'}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              An unexpected render error occurred in this component. Your data is safe.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-red-600 bg-red-50 p-2 rounded-lg mt-2 inline-block max-w-full overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{this.props.resetLabel || 'Try Again'}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default VendorErrorBoundary;
