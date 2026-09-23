import path from 'path';
import { DocumentModel } from '../models/Document';
import { extractText } from './textExtractor';
import { analyzeText } from './aiService';
import {
  extractAmounts,
  extractDates,
  extractEmails,
  extractPhones,
  extractiveSummary,
  guessDocumentType,
} from '../utils/extractInfo';

export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Runs the whole pipeline for one document:
 * uploaded -> processing -> (extract text -> AI analysis) -> completed | failed
 * It is called WITHOUT await from the controller, so the upload API returns fast
 * and the frontend just polls the status.
 */
export async function processDocument(documentId: string): Promise<void> {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) return;

  try {
    doc.status = 'processing';
    doc.errorMessage = '';
    await doc.save();

    const filePath = path.join(UPLOAD_DIR, doc.filename);
    const text = (await extractText(filePath, doc.fileType)).trim();

    if (!text) {
      throw new Error(
        doc.fileType === 'pdf'
          ? 'No text found in this PDF. It may be a scanned PDF - try uploading it as an image (PNG/JPG).'
          : 'No text could be read from this file.'
      );
    }

    // Regex based extraction always runs (fast + free)
    const emails = extractEmails(text);
    const phones = extractPhones(text);
    const dates = extractDates(text);
    const amounts = extractAmounts(text);

    // AI analysis - if the API fails we still keep a local summary instead of failing the whole document
    let ai;
    try {
      ai = await analyzeText(text);
    } catch (err) {
      console.error('AI analysis failed, using local fallback:', (err as Error).message);
      ai = {
        summary: extractiveSummary(text),
        documentType: guessDocumentType(text),
        keyPoints: [],
        people: [],
        organizations: [],
        provider: 'local',
      };
    }

    doc.extractedText = text;
    doc.summary = ai.summary;
    doc.aiProvider = ai.provider;
    doc.keyInfo = {
      documentType: ai.documentType,
      keyPoints: ai.keyPoints,
      people: ai.people,
      organizations: ai.organizations,
      emails,
      phones,
      dates,
      amounts,
    };
    doc.status = 'completed';
    await doc.save();
  } catch (err) {
    doc.status = 'failed';
    doc.errorMessage = (err as Error).message || 'Processing failed';
    await doc.save();
  }
}
