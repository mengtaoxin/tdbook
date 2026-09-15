import type { RewrittenPage } from './rewriteHtml'

const BASE_CSS = `
:host {
  display: block;
  line-height: 1.6;
}

body {
  margin: 0;
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
export function renderEpubShadow(shadow: ShadowRoot, page: RewrittenPage) {
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

  // Fake <body> so EPUB rules targeting `body` still apply inside the shadow tree.
  const body = document.createElement('body')
  if (page.bodyClass) body.className = page.bodyClass
  body.innerHTML = page.html
  shadow.appendChild(body)
}

export function scrollEpubHash(shadow: ShadowRoot, hash: string) {
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) return
  shadow.getElementById(id)?.scrollIntoView()
}
