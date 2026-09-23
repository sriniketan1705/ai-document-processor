import { Schema, model, Types, Document as MongoDoc } from 'mongoose';

export type DocStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type FileType = 'pdf' | 'image' | 'text';

export interface IDocument extends MongoDoc {
  user: Types.ObjectId;
  title: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  status: DocStatus;
  extractedText: string;
  summary: string;
  keyInfo: {
    documentType: string;
    keyPoints: string[];
    emails: string[];
    phones: string[];
    dates: string[];
    amounts: string[];
    people: string[];
    organizations: string[];
  };
  tags: string[];
  notes: string;
  errorMessage: string;
  aiProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    fileType: { type: String, enum: ['pdf', 'image', 'text'], required: true },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    extractedText: { type: String, default: '' },
    summary: { type: String, default: '' },
    keyInfo: {
      documentType: { type: String, default: '' },
      keyPoints: { type: [String], default: [] },
      emails: { type: [String], default: [] },
      phones: { type: [String], default: [] },
      dates: { type: [String], default: [] },
      amounts: { type: [String], default: [] },
      people: { type: [String], default: [] },
      organizations: { type: [String], default: [] },
    },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    aiProvider: { type: String, default: '' },
  },
  { timestamps: true }
);

export const DocumentModel = model<IDocument>('Document', documentSchema);
