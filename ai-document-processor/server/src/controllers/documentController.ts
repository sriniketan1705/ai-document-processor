import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { DocumentModel } from '../models/Document';
import { MIME_TO_TYPE } from '../services/textExtractor';
import { processDocument, UPLOAD_DIR } from '../services/processService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finds a document that belongs to the logged-in user, otherwise 404
async function findOwnDocument(req: Request) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid document id', 400);
  const doc = await DocumentModel.findOne({ _id: id, user: req.userId });
  if (!doc) throw new AppError('Document not found', 404);
  return doc;
}

const removeFile = (filename: string) => fs.promises.unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);

// POST /api/documents
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Please choose a file to upload', 400);

  const title = String(req.body.title || '').trim() || req.file.originalname;
  const doc = await DocumentModel.create({
    user: req.userId,
    title,
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    fileType: MIME_TO_TYPE[req.file.mimetype],
    status: 'uploaded',
  });

  // start processing in the background (no await on purpose)
  processDocument(doc.id).catch((e) => console.error('processDocument error:', e));

  res.status(201).json({ success: true, document: doc });
});

// GET /api/documents?search=&status=&fileType=&sort=&page=&limit=
export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, fileType, sort = 'newest' } = req.query as Record<string, string>;
  const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 10, 1), 50);

  const filter: Record<string, unknown> = { user: req.userId };
  if (status && ['uploaded', 'processing', 'completed', 'failed'].includes(status)) filter.status = status;
  if (fileType && ['pdf', 'image', 'text'].includes(fileType)) filter.fileType = fileType;
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { originalName: rx }, { summary: rx }, { tags: rx }, { extractedText: rx }];
  }

  const sortBy: Record<string, 1 | -1> = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter)
      .select('-extractedText') // list view doesn't need the big text field
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit),
    DocumentModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    documents,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/documents/stats
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const rows = await DocumentModel.aggregate([
    { $match: { user: new Types.ObjectId(req.userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats = { total: 0, uploaded: 0, processing: 0, completed: 0, failed: 0 };
  rows.forEach((r) => {
    stats[r._id as keyof typeof stats] = r.count;
    stats.total += r.count;
  });
  res.json({ success: true, stats });
});

// GET /api/documents/:id
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await findOwnDocument(req);
  res.json({ success: true, document: doc });
});

// GET /api/documents/:id/file  (download original file)
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const doc = await findOwnDocument(req);
  const filePath = path.join(UPLOAD_DIR, doc.filename);
  if (!fs.existsSync(filePath)) throw new AppError('File no longer exists on the server', 404);
  res.download(filePath, doc.originalName);
});

// PUT /api/documents/:id  (edit title / summary / tags / notes)
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await findOwnDocument(req);
  const { title, summary, tags, notes } = req.body || {};

  if (title !== undefined) {
    if (!String(title).trim()) throw new AppError('Title cannot be empty', 400);
    doc.title = String(title).trim();
  }
  if (summary !== undefined) doc.summary = String(summary);
  if (notes !== undefined) doc.notes = String(notes);
  if (tags !== undefined) {
    if (!Array.isArray(tags)) throw new AppError('Tags must be an array', 400);
    doc.tags = [...new Set(tags.map((t: unknown) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 15);
  }

  await doc.save();
  res.json({ success: true, document: doc });
});

// POST /api/documents/:id/reprocess
export const reprocessDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await findOwnDocument(req);
  if (doc.status === 'processing') throw new AppError('Document is already being processed', 409);

  doc.status = 'uploaded';
  doc.errorMessage = '';
  await doc.save();
  processDocument(doc.id).catch((e) => console.error('processDocument error:', e));

  res.json({ success: true, document: doc });
});

// DELETE /api/documents/:id
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await findOwnDocument(req);
  await removeFile(doc.filename);
  await doc.deleteOne();
  res.json({ success: true, message: 'Document deleted' });
});
