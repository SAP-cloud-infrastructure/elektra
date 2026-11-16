import React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  // Optional custom fallback. Receives the caught error and a reset callback.
  fallback?: (error: Error, reset: () => void) => React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// Top-level React error boundary. Catches render/runtime errors from anywhere in
// its subtree and shows a single alert at the TOP of the widget (above the rest
// of the UI), instead of letting a nested component render a message in place
// (which can end up buried below the page content). Reusable across widgets.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface it in the console for debugging; the UI shows the friendly alert.
    console.error("ErrorBoundary caught an error:", error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset)
      return (
        <div className="alert alert-danger" role="alert">
          <strong>Something went wrong.</strong>
          {error.message && <span className="ms-1">{error.message}</span>}
        </div>
      )
    }
    return this.props.children
  }
}
