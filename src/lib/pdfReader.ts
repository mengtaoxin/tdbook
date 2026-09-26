import {
  getDocument,
  GlobalWorkerOptions,
  RenderingCancelledException,
  TextLayer,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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
    const scale = target.cssWidth / unscaled.width;
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    const canvas = target.canvas;
    canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
    canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const pageEl = target.pageEl;
    pageEl.style.width = `${Math.floor(viewport.width)}px`;
    pageEl.style.height = `${Math.floor(viewport.height)}px`;
    pageEl.style.setProperty('--scale-factor', String(scale));
    pageEl.style.setProperty('--user-unit', String(page.userUnit || 1));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('errors.canvasCreateFailed');

    const transform = outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0];

    renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform,
    });
    await renderTask.promise;
    if (cancelled) return;

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
