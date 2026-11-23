import type { TFunction } from 'i18next';
import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { shouldCollapseNav, toolbarNavAvailableWidth } from '@/lib/navLayout';

export function useCompactNav({
  locale,
  t,
  bookId,
  pathname,
}: {
  locale: string;
  t: TFunction;
  bookId: string | null;
  pathname: string;
}): {
  compactNav: boolean;
  toolbarRef: RefObject<HTMLDivElement | null>;
  leftClusterRef: RefObject<HTMLDivElement | null>;
  desktopNavRef: RefObject<HTMLElement | null>;
} {
  const [compactNav, setCompactNav] = useState(true);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const leftClusterRef = useRef<HTMLDivElement | null>(null);
  const desktopNavRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    const leftCluster = leftClusterRef.current;
    const nav = desktopNavRef.current;
    if (!toolbar || !leftCluster || !nav) return;

    function updateCompactNav() {
      if (!toolbar || !leftCluster || !nav) return;
      const toolbarStyle = getComputedStyle(toolbar);
      const leftClusterStyle = getComputedStyle(leftCluster);
      const availableWidth = toolbarNavAvailableWidth({
        toolbarClientWidth: toolbar.clientWidth,
        toolbarPaddingLeft: parseFloat(toolbarStyle.paddingLeft) || 0,
        toolbarPaddingRight: parseFloat(toolbarStyle.paddingRight) || 0,
        toolbarGap: parseFloat(toolbarStyle.columnGap || toolbarStyle.gap) || 0,
        leftClusterWidth: leftCluster.offsetWidth,
        leftClusterMarginEnd:
          parseFloat(leftClusterStyle.marginInlineEnd || leftClusterStyle.marginRight) || 0,
      });
      setCompactNav(shouldCollapseNav(nav.scrollWidth, availableWidth));
    }

    updateCompactNav();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      updateCompactNav();
    });
    observer.observe(toolbar);
    observer.observe(leftCluster);
    observer.observe(nav);
    return () => observer.disconnect();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- nav labels, breadcrumb, and bookmarks change width
  }, [locale, t, bookId, pathname]);

  return { compactNav, toolbarRef, leftClusterRef, desktopNavRef };
}
