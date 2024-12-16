import React from 'react';
import { useDispatch } from 'react-redux';

class ResponseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Response error:', {
      error,
      info: errorInfo,
      timestamp: Date.now()
    });
  }

  render() {
    if (this.state.hasError) {
      return null; // Silent failure to not interrupt experiment flow
    }
    return this.props.children;
  }
}

export const withResponseErrorHandling = (WrappedComponent) => {
  return (props) => (
    <ResponseErrorBoundary>
      <WrappedComponent {...props} />
    </ResponseErrorBoundary>
  );
};
