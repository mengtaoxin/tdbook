import { scrollEpubAnchor } from './epubAnchor';
import type { RewrittenPage } from './rewriteHtml';

/**
 * Defaults that override host/theme inheritance (UI font, `lang`, etc.).
 * Book stylesheets still win when they set the same properties, except selection.
 */
const BASE_CSS = `
.epub-content {
  display: block;
  color: #000;
  background: transparent;
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 16px;
  font-weight: 400;
  font-style: normal;
  font-variant: normal;
  line-height: 1.6;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: start;
  text-indent: 0;
  text-transform: none;
  text-decoration: none;
  text-shadow: none;
  -webkit-font-smoothing: auto;
  -webkit-user-select: text;
  user-select: text;
}

.epub-content body {
  margin: 0;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  text-align: inherit;
  text-indent: inherit;
  text-transform: inherit;
  -webkit-user-select: text;
  user-select: text;
}

.epub-content img,
.epub-content svg {
  max-width: 100%;
  height: auto;
}

.epub-content a {
  color: #1565c0;
}
`;

/** Wins over book CSS that sets user-select: none. Body text must stay selectable. */
const SELECTION_LOCK_CSS = `
.epub-content,
.epub-content * {
  -webkit-user-select: text !important;
  user-select: text !important;
}
`;

const READER_SCOPE = '.epub-content';
const CHARSET_RE = /^@charset\b/i;
const IMPORT_RE = /^@import\b/i;
const HOIST_RE =
  /^@(?:namespace|font-face|keyframes|-webkit-keyframes|-moz-keyframes|counter-style|property|font-feature-values|page)\b/i;

function skipCssNoise(css: string, index: number): number {
  let i = index;
  while (i < css.length) {
    const ch = css[i] ?? '';
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    break;
  }
  return i;
}

function readCssRule(css: string, start: number): { text: string; end: number } {
  let i = start;
  let quote: '"' | "'" | null = null;
  let depth = 0;
  let seenBrace = false;

  while (i < css.length) {
    const ch = css[i] ?? '';
    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      seenBrace = true;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      i += 1;
      if (depth <= 0) return { text: css.slice(start, i), end: i };
      continue;
    }
    if (ch === ';' && depth === 0 && !seenBrace) {
      return { text: css.slice(start, i + 1), end: i + 1 };
    }
    i += 1;
  }
  return { text: css.slice(start), end: css.length };
}

/** Keep book CSS inside the reader. Hoist at-rules that cannot live in @scope. */
export function scopeEpubCss(css: string): string {
  const charsets: string[] = [];
  const imports: string[] = [];
  const hoisted: string[] = [];
  const scoped: string[] = [];
  let i = 0;

  while (i < css.length) {
    i = skipCssNoise(css, i);
    if (i >= css.length) break;
    const rule = readCssRule(css, i);
    const text = rule.text.trim();
    i = rule.end;
    if (!text) continue;
    if (CHARSET_RE.test(text)) charsets.push(text);
    else if (IMPORT_RE.test(text)) imports.push(text);
    else if (HOIST_RE.test(text)) hoisted.push(text);
    else scoped.push(text);
  }

  return `${[...charsets, ...imports, ...hoisted].join('\n')}
@scope (${READER_SCOPE}) {
${scoped.join('\n')}
}
`;
}

export async function renderEpubContent(
  host: HTMLElement,
  page: RewrittenPage,
  signal?: AbortSignal,
): Promise<void> {
  const sheets = await Promise.all(
    page.stylesheetUrls.map(async (href) => {
      try {
        const response = await fetch(href, { signal });
        if (!response.ok) return '';
        return await response.text();
      } catch {
        return '';
      }
    }),
  );
  if (signal?.aborted) return;

  host.replaceChildren();
  host.lang = page.lang;

  const base = document.createElement('style');
  base.textContent = BASE_CSS;
  host.appendChild(base);

  for (const css of [...sheets, ...page.inlineStyles]) {
    if (!css.trim()) continue;
    const style = document.createElement('style');
    style.textContent = scopeEpubCss(css);
    host.appendChild(style);
  }

  const lock = document.createElement('style');
  lock.textContent = SELECTION_LOCK_CSS;
  host.appendChild(lock);

  // Fake <body> so EPUB rules targeting `body` still apply. It stays in the
  // document so window.getSelection() and accessibility can read the text.
  const body = document.createElement('body');
  body.lang = page.lang;
  if (page.bodyClass) body.className = page.bodyClass;
  body.innerHTML = page.html;
  host.appendChild(body);
}

export function clearEpubContent(host: HTMLElement | null | undefined) {
  host?.replaceChildren();
}

export function scrollEpubHash(host: HTMLElement, hash: string) {
  scrollEpubAnchor(host, hash);
}
