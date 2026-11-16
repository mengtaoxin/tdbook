import type { TFunction } from 'i18next';
import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { shouldCollapseNav, toolbarNavAvailableWidth } from '@/lib/navLayout';

export function useCompactNav({
  locale,
  t,
  bookId,
}: {
  locale: string;
  t: TFunction;
  bookId: string | null;
}): {
  compactNav: boolean;
  toolbarRef: RefObject<HTMLDivElement | null>;
  brandRef: RefObject<HTMLAnchorElement | null>;
  desktopNavRef: RefObject<HTMLElement | null>;
} {
  const [compactNav, setCompactNav] = useState(true);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLAnchorElement | null>(null);
  const desktopNavRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    const brand = brandRef.current;
    const nav = desktopNavRef.current;
    if (!toolbar || !brand || !nav) return;

    function updateCompactNav() {
      if (!toolbar || !brand || !nav) return;
      const toolbarStyle = getComputedStyle(toolbar);
      const brandStyle = getComputedStyle(brand);
      const availableWidth = toolbarNavAvailableWidth({
        toolbarClientWidth: toolbar.clientWidth,
        toolbarPaddingLeft: parseFloat(toolbarStyle.paddingLeft) || 0,
        toolbarPaddingRight: parseFloat(toolbarStyle.paddingRight) || 0,
        toolbarGap: parseFloat(toolbarStyle.columnGap || toolbarStyle.gap) || 0,
        brandWidth: brand.offsetWidth,
        brandMarginEnd: parseFloat(brandStyle.marginInlineEnd || brandStyle.marginRight) || 0,
      });
      setCompactNav(shouldCollapseNav(nav.scrollWidth, availableWidth));
    }

    updateCompactNav();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      updateCompactNav();
    });
    observer.observe(toolbar);
    observer.observe(nav);
    return () => observer.disconnect();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- nav labels and the bookmarks button change its width
  }, [locale, t, bookId]);

  return { compactNav, toolbarRef, brandRef, desktopNavRef };
}
