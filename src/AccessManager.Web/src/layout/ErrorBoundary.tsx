import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Title3 } from '@fluentui/react-components';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Access Manager UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section className="error-boundary" role="alert">
        <Title3 as="h1">This view failed to render</Title3>
        <p>The inventory client seam did not throw a provider token. Reload the shell and continue from Overview.</p>
        <pre>{this.state.error.message}</pre>
        <Button onClick={() => this.setState({ error: null })}>Try again</Button>
      </section>
    );
  }
}
