import { describe, it, expect } from 'vitest';

import { configGuideMarkdownUrl, renderMarkdown } from '@/lib/configGuideMarkdown';

describe('configGuideMarkdownUrl', () => {
  it('returns the English guide path for non-Chinese locales', () => {
    expect(configGuideMarkdownUrl('en')).toBe('/how-to-write-config-file.md');
    expect(configGuideMarkdownUrl('en-US')).toBe('/how-to-write-config-file.md');
  });

  it('returns the Chinese guide path when locale starts with zh', () => {
    expect(configGuideMarkdownUrl('zh')).toBe('/how-to-write-config-file.zh.md');
    expect(configGuideMarkdownUrl('zh-CN')).toBe('/how-to-write-config-file.zh.md');
  });
});

describe('renderMarkdown', () => {
  it('renders headings, lists, and fenced code blocks as HTML', () => {
    const html = renderMarkdown(`# Title

- item one

\`\`\`
{ "books": [] }
\`\`\`
`);

    expect(html).toContain('<h1');
    expect(html).toContain('Title');
    expect(html).toContain('<li');
    expect(html).toContain('item one');
    expect(html).toContain('<pre');
    expect(html).toContain('books');
  });
});
