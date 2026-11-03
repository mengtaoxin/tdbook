import { Component, type ReactNode } from 'react';
import { handleChunkLoadFailure, isChunkLoadError } from '@/lib/spaUpdateNotice';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Forwards stale-chunk failures to spa-update-notice; other errors rethrow. */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    if (isChunkLoadError(error)) return { hasError: true };
    throw error;
  }

  componentDidCatch(error: unknown): void {
    if (isChunkLoadError(error)) {
      handleChunkLoadFailure();
    }
  }

  render(): ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
