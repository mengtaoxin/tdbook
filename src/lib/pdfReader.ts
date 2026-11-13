import {
  getDocument,
  GlobalWorkerOptions,
  RenderingCancelledException,
  TextLayer,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist';
// oxlint-disable-next-line import/default -- Vite `?url` imports are typed by vite/client, not the module.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { pdfMarginTightenLayout } from '@/lib/pdfMarginTighten';
import { commitPdfRenderBuffer, createPdfRenderBuffer } from '@/lib/pdfRenderBuffer';

GlobalWorkerOptions.workerSrc = pdfWorker;

const documents = new Map<string, Promise<PDFDocumentProxy>>();

function pdfAssetUrl(kind: 'cmaps' | 'standard_fonts' | 'wasm' | 'iccs') {
  return `/pdfjs/${kind}/`;
}

export function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  let pending = documents.get(url);
  if (!pending) {
    pending = getDocument({
      url,
      cMapUrl: pdfAssetUrl('cmaps'),
      cMapPacked: true,
      standardFontDataUrl: pdfAssetUrl('standard_fonts'),
      wasmUrl: pdfAssetUrl('wasm'),
      iccUrl: pdfAssetUrl('iccs'),
    }).promise;
    documents.set(url, pending);
    pending.catch(() => {
      documents.delete(url);
    });
  }
  return pending;
}

export function unloadPdfDocument(url: string) {
  documents.delete(url);
}

export async function renderPdfCover(
  doc: PDFDocumentProxy,
  targetHeight = 280,
): Promise<string | null> {
  const page = await doc.getPage(1);
  const unscaled = page.getViewport({ scale: 1 });
  const scale = targetHeight / unscaled.height;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext('2d');
  if (!context) return null;
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.82);
}

export type PdfPageTarget = {
  canvas: HTMLCanvasElement;
  textLayerEl: HTMLElement;
  pageEl: HTMLElement;
  cssWidth: number;
  /** Fraction of page width cropped from each side; see `pdfMarginTighten`. */
  tighten: number;
};

export type PdfPageRender = {
  cancel: () => void;
  promise: Promise<void>;
};

function isCancelled(error: unknown) {
  return (
    error instanceof RenderingCancelledException ||
    (error instanceof Error && error.name === 'RenderingCancelledException')
  );
}

export function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  target: PdfPageTarget,
): PdfPageRender {
  let cancelled = false;
  let renderTask: RenderTask | undefined;
  let textLayer: TextLayer | undefined;

  const promise = (async () => {
    const page = await doc.getPage(pageNumber);
    if (cancelled) return;

    const unscaled = page.getViewport({ scale: 1 });
    const { scale, insetCss } = pdfMarginTightenLayout(
      unscaled.width,
      target.cssWidth,
      target.tighten,
    );
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;
    const cssWidth = Math.floor(viewport.width);
    const cssHeight = Math.floor(viewport.height);
    const pixelWidth = Math.max(1, Math.floor(viewport.width * outputScale));
    const pixelHeight = Math.max(1, Math.floor(viewport.height * outputScale));

    // Paint offscreen so the previous page stays visible until this one is ready.
    const buffer = createPdfRenderBuffer(pixelWidth, pixelHeight);
    const bufferContext = buffer.getContext('2d');
    if (!bufferContext) throw new Error('errors.canvasCreateFailed');

    const transform = outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0];

    renderTask = page.render({
      canvas: buffer,
      canvasContext: bufferContext,
      viewport,
      transform,
    });
    await renderTask.promise;
    if (cancelled) return;

    commitPdfRenderBuffer(target.canvas, buffer, cssWidth, cssHeight);

    const pageEl = target.pageEl;
    pageEl.style.width = `${cssWidth}px`;
    pageEl.style.height = `${cssHeight}px`;
    pageEl.style.transform = insetCss > 0 ? `translateX(${-Math.floor(insetCss)}px)` : '';
    pageEl.style.setProperty('--scale-factor', String(scale));
    pageEl.style.setProperty('--user-unit', String(page.userUnit || 1));

    target.textLayerEl.replaceChildren();
    textLayer = new TextLayer({
      textContentSource: page.streamTextContent(),
      container: target.textLayerEl,
      viewport,
    });
    await textLayer.render();
  })().catch((error: unknown) => {
    if (cancelled || isCancelled(error)) return;
    throw error;
  });

  return {
    cancel() {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
    },
    promise,
  };
}
