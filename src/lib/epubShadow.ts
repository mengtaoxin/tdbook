import type { RewrittenPage } from './rewriteHtml'

/**
 * Defaults that override host/theme inheritance (Vuetify font, UI `lang`, etc.).
 * Book stylesheets still win when they set the same properties.
 */
const BASE_CSS = `
:host {
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
}

body {
  margin: 0;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  text-align: inherit;
  text-indent: inherit;
  text-transform: inherit;
}

img,
svg {
  max-width: 100%;
  height: auto;
}

a {
  color: #1565c0;
}
`

export function attachEpubShadow(host: HTMLElement): ShadowRoot {
  return host.shadowRoot ?? host.attachShadow({ mode: 'open' })
}

export function clearEpubShadow(shadow: ShadowRoot | null | undefined) {
  if (shadow) shadow.innerHTML = ''
}

/** Render EPUB HTML + CSS inside a shadow root so book styles stay isolated. */
export function renderEpubShadow(
  shadow: ShadowRoot,
  page: RewrittenPage,
  host?: HTMLElement,
) {
  shadow.innerHTML = ''

  const base = document.createElement('style')
  base.textContent = BASE_CSS
  shadow.appendChild(base)

  for (const href of page.stylesheetUrls) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    shadow.appendChild(link)
  }

  for (const css of page.inlineStyles) {
    const style = document.createElement('style')
    style.textContent = css
    shadow.appendChild(style)
  }

  // Book language (not UI locale) so font shaping / -webkit-locale stay stable.
  if (host) host.lang = page.lang

  // Fake <body> so EPUB rules targeting `body` still apply inside the shadow tree.
  const body = document.createElement('body')
  body.lang = page.lang
  if (page.bodyClass) body.className = page.bodyClass
  body.innerHTML = page.html
  shadow.appendChild(body)
}

export function scrollEpubHash(shadow: ShadowRoot, hash: string) {
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) return
  shadow.getElementById(id)?.scrollIntoView()
}
