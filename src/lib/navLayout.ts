/** True when horizontal nav content cannot fit without clipping. */
export function shouldCollapseNav(contentWidth: number, availableWidth: number): boolean {
  if (availableWidth <= 0) return true;
  return contentWidth > availableWidth;
}
