import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { env } from '../config/env';
import type { FileType } from '../models/Document';


export const MIME_TO_TYPE: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'text/plain': 'text',
};

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

const OCR_TIMEOUT_MS = 120_000;

async function ocrImage(filePath: string): Promise<string> {
  let worker: OcrWorker | undefined;
  let timer: NodeJS.Timeout | undefined;

  // tesseract.js reports some failures (e.g. language data download failed) only through
  // errorHandler and never rejects, so we turn those into a normal rejected promise ourselves.
  let fail: (e: Error) => void = () => undefined;
  const failure = new Promise<never>((_, reject) => {
    fail = reject;
  });
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('OCR timed out')), OCR_TIMEOUT_MS);
  });

  const run = (async () => {
    // First run downloads the English language data (needs internet).
    // Set TESSERACT_LANG_PATH to a folder containing eng.traineddata to work offline.
    worker = await createWorker('eng', 1, {
      ...(env.tesseractLangPath ? { langPath: env.tesseractLangPath, gzip: false } : {}),
      errorHandler: (err) =>
        fail(new Error(`OCR failed: ${String(err)}. Check your internet connection (language data download).`)),
    });
    const { data } = await worker.recognize(filePath);
    return data.text;
  })();
  run.catch(() => undefined); // avoid an unhandled rejection if a failure/timeout wins the race

  try {
    return await Promise.race([run, failure, timeout]);
  } finally {
    clearTimeout(timer);
    await worker?.terminate().catch(() => undefined);
  }
}

export async function extractText(filePath: string, fileType: FileType): Promise<string> {
  switch (fileType) {
    case 'pdf': {
      const buffer = await fs.promises.readFile(filePath);
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text.replace(/^-- \d+ of \d+ --$/gm, '');
      } finally {
        await parser.destroy();
      }
    }
    case 'image':
      return ocrImage(filePath);
    case 'text':
      return fs.promises.readFile(filePath, 'utf-8');
    default:
      throw new Error(`Unsupported file type for ${path.basename(filePath)}`);
  }
}
