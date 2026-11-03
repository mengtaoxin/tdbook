import { Component, type ReactNode } from 'react';
import { isChunkError, showUpdateNotice } from '@/lib/spaUpdateNotice';

type Props = { children: ReactNode };
type State = { chunkError: boolean };

/**
 * Catches stale-chunk / dynamic-import failures after a deploy and shows the
 * hosted spa-update-notice UI instead of a blank React error.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { chunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    if (isChunkError(error)) return { chunkError: true };
    throw error;
  }

  componentDidCatch(error: unknown): void {
    if (!isChunkError(error)) return;
    void showUpdateNotice();
  }

  render(): ReactNode {
    if (this.state.chunkError) return null;
    return this.props.children;
  }
}
