import React from "react";
import { HiOutlineDocumentSearch } from "react-icons/hi";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="bg-black min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-6xl text-indigo-500 font-bold">4</span>
              <HiOutlineDocumentSearch className="text-5xl text-indigo-300 bg-white p-2 rounded-full" />
              <span className="text-6xl text-indigo-500 font-bold">4</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-medium text-white mb-2">
              <span className="text-indigo-500 font-semibold">Oops!</span> It seems like you've taken a wrong turn
            </h1>
            <p className="text-sm text-gray-400">We're working to bring it back.</p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
