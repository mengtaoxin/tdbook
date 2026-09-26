/** True when horizontal nav content cannot fit without clipping. */
export function shouldCollapseNav(contentWidth: number, availableWidth: number): boolean {
  if (availableWidth <= 0) return true;
  return contentWidth > availableWidth;
}

export type ToolbarNavSpace = {
  toolbarClientWidth: number;
  toolbarPaddingLeft: number;
  toolbarPaddingRight: number;
  toolbarGap: number;
  brandWidth: number;
  brandMarginEnd: number;
};

/**
 * Horizontal space left for desktop nav inside a toolbar after brand, padding,
 * and the gap between brand and nav.
 */
export function toolbarNavAvailableWidth(space: ToolbarNavSpace): number {
  return (
    space.toolbarClientWidth -
    space.toolbarPaddingLeft -
    space.toolbarPaddingRight -
    space.brandWidth -
    space.brandMarginEnd -
    space.toolbarGap
  );
}
