import { describe, expect, it } from 'vitest'
import { attachEpubShadow, renderEpubShadow } from '@/lib/epubShadow'
import type { RewrittenPage } from '@/lib/rewriteHtml'

function page(overrides: Partial<RewrittenPage> = {}): RewrittenPage {
  return {
    html: '<p>Hello</p>',
    bodyClass: '',
    lang: 'en',
    stylesheetUrls: [],
    inlineStyles: [],
    ...overrides,
  }
}

describe('renderEpubShadow', () => {
  it('pins book lang on host and body, independent of document lang', () => {
    document.documentElement.lang = 'zh-CN'
    const host = document.createElement('div')
    document.body.appendChild(host)

    const shadow = attachEpubShadow(host)
    renderEpubShadow(shadow, page({ lang: 'en' }), host)

    const body = shadow.querySelector('body')
    expect(host.lang).toBe('en')
    expect(body?.lang).toBe('en')
    expect(document.documentElement.lang).toBe('zh-CN')

    document.documentElement.lang = 'en'
    host.remove()
  })

  it('injects base CSS that resets theme font inheritance', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const shadow = attachEpubShadow(host)
    renderEpubShadow(shadow, page(), host)

    const css = shadow.querySelector('style')?.textContent ?? ''
    expect(css).toContain('font-family: Georgia')
    expect(css).toContain(':host')

    host.remove()
  })
})
