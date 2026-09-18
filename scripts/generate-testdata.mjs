#!/usr/bin/env node
/**
 * Generates minimal EPUB/PDF fixtures under public/testdata for e2e + local smoke.
 * Invoked via `npm run testdata` (also run by `npm run test:e2e`).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const root = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(root, '..', 'public', 'testdata')

fs.mkdirSync(outDir, { recursive: true })

async function writeSampleEpub() {
  const zip = new JSZip()
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0"?>
<package version="3.0" unique-identifier="uid" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">sample-epub</dc:identifier>
    <dc:title>Sample EPUB</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
    <itemref idref="c2"/>
  </spine>
</package>`,
  )
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Nav</title></head>
<body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol>
<li><a href="chapter1.xhtml">One</a></li>
<li><a href="chapter2.xhtml">Two</a></li>
</ol></nav></body></html>`,
  )
  zip.file(
    'OEBPS/chapter1.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>One</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1 id="top">Chapter One</h1><p>Hello from sample EPUB page one.</p>
<p><a href="chapter2.xhtml">Next chapter</a></p></body></html>`,
  )
  zip.file(
    'OEBPS/chapter2.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Two</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>Chapter Two</h1><p>Hello from sample EPUB page two.</p></body></html>`,
  )
  zip.file('OEBPS/style.css', 'h1 { color: #333; } p { line-height: 1.5; }')

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  fs.writeFileSync(path.join(outDir, 'sample.epub'), buffer)
}

function writeSamplePdf() {
  // Minimal one-page PDF with visible text "Sample PDF".
  const content = 'BT /F1 24 Tf 72 72 Td (Sample PDF) Tj ET'
  const objects = [
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n',
    `4 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj\n`,
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n',
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'))
    body += obj
  }
  const xrefStart = Buffer.byteLength(body, 'utf8')
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  body += `startxref\n${xrefStart}\n%%EOF\n`
  fs.writeFileSync(path.join(outDir, 'sample.pdf'), body)
}

function writeConfigs() {
  // Absolute-looking URLs are required by the catalog validator; e2e rewrites
  // host to the running Vite origin via Playwright baseURL + path.
  const configs = {
    books: [
      {
        id: 'sample-epub',
        title: 'Sample EPUB',
        author: 'Test Author',
        type: 'epub',
        path: 'http://127.0.0.1:3000/testdata/sample.epub',
      },
      {
        id: 'sample-pdf',
        title: 'Sample PDF',
        author: 'Test Author',
        type: 'pdf',
        path: 'http://127.0.0.1:3000/testdata/sample.pdf',
      },
    ],
  }
  fs.writeFileSync(
    path.join(outDir, 'configs.json'),
    `${JSON.stringify(configs, null, 2)}\n`,
  )
}

await writeSampleEpub()
writeSamplePdf()
writeConfigs()
console.log(`Wrote fixtures to ${outDir}`)
