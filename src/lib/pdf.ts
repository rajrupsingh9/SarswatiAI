import * as pdfjs from 'pdfjs-dist';
import { TextItem, TextLayer } from '../types/academic';

// Configure the worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export async function getPdfPages(file: File): Promise<{ pages: string[], textLayers: TextLayer[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  const textLayers: TextLayer[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // High res for Gemini vision
    
    // 1. Render to Image
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await (page as any).render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    pages.push(canvas.toDataURL('image/jpeg', 0.8));

    // 2. Extract Text Layer
    const textContent = await page.getTextContent();
    const items: TextItem[] = textContent.items.map((item: any) => {
      // items are in PDF space, we need to map them to Viewport space (pixels)
      // pdfjs.Util.transform(viewport.transform, item.transform)
      const tx = pdfjs.Util.transform(viewport.transform, item.transform);
      return {
        text: item.str,
        transform: Array.from(tx),
        width: item.width * 2, // approximation
        height: item.height * 2 // approximation
      };
    });
    textLayers.push({ items });
  }

  return { pages, textLayers };
}

export async function getFileAsImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
