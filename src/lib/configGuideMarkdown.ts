import { marked } from 'marked'

const EN_URL = '/how-to-write-config-file.md'
const ZH_URL = '/how-to-write-config-file.zh.md'

export function configGuideMarkdownUrl(locale: string): string {
  return locale.startsWith('zh') ? ZH_URL : EN_URL
}

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false }) as string
}
