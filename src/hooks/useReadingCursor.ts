import { useEffect, useState } from 'react';
import { visibleReadingTop } from '@/lib/epubAnchor';
import {
  excerptAtReadingPosition,
  markCurrentReadingBlock,
  normalizeSelectedText,
  selectionInside,
} from '@/lib/readerA11y';

function readingSurface(): { root: Element; host: Element } | null {
  const epubHost = document.querySelector<HTMLElement>('[data-testid="epub-content"]');
  const body = epubHost?.querySelector('body');
  if (epubHost && body) return { root: body, host: epubHost };

  const pdfHost = document.querySelector<HTMLElement>('[data-testid="pdf-host"]');
  const textLayer = pdfHost?.querySelector('.textLayer');
  if (pdfHost && textLayer && textLayer.childElementCount > 0) {
    return { root: textLayer, host: pdfHost };
  }
  return null;
}

/**
 * Tracks the in-view passage and the settled text selection.
 * The passage is not a live region: scrolling must not keep announcing.
 */
export function useReadingCursor(pageKey: string) {
  const [passage, setPassage] = useState('');
  const [selected, setSelected] = useState('');

  useEffect(() => {
    let frame = 0;
    const observer = new MutationObserver(() => {
      schedule();
    });

    function update() {
      const surface = readingSurface();
      if (!surface) {
        if (pageKey) setPassage((current) => (current === '' ? current : ''));
        return;
      }
      const line = visibleReadingTop(surface.host);
      markCurrentReadingBlock(surface.root, line);
      const next = excerptAtReadingPosition(surface.root, line);
      setPassage((current) => (current === next ? current : next));
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    // EPUB HTML and the PDF text layer arrive as later light-DOM mutations.
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [pageKey]);

  useEffect(() => {
    let timer = 0;

    function onSelectionChange() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const boundary = document.querySelector<HTMLElement>('[data-testid="reader-article"]');
        const selection = document.getSelection();
        const next =
          selection && selectionInside(selection, boundary)
            ? normalizeSelectedText(selection.toString())
            : '';
        setSelected((current) => (current === next ? current : next));
      }, 300);
    }

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      window.clearTimeout(timer);
    };
  }, []);

  return { passage, selected };
}
