import React from "react";
import { RotateCcw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
          
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full text-center px-10 py-12 flex flex-col items-center">

            {/* Large Illustration */}
            <div className="mb-8">
              <img
                src="/errorpage.svg"
                alt="Error Illustration"
                className="w-56 md:w-64 lg:w-72 drop-shadow-md"
              />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="text-slate-500 leading-relaxed max-w-md mb-8">
              An unexpected error occurred while rendering this page.
              Please try refreshing the page or return to the homepage.
            </p>

            {/* Error message */}
            <div className="bg-slate-100 text-slate-600 text-xs font-mono px-3 py-2 rounded-lg mb-10 max-w-md break-words">
              {this.state.error?.message || "Unknown rendering error"}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">

              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.97]"
              >
                <RotateCcw size={18} />
                Try Again
              </button>

              <button
                onClick={this.handleHome}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                <Home size={18} />
                Go Home
              </button>

            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;