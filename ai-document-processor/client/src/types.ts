export type DocStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type FileType = 'pdf' | 'image' | 'text';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface KeyInfo {
  documentType: string;
  keyPoints: string[];
  emails: string[];
  phones: string[];
  dates: string[];
  amounts: string[];
  people: string[];
  organizations: string[];
}

export interface DocumentItem {
  _id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  status: DocStatus;
  extractedText?: string; // only present on the detail endpoint
  summary: string;
  keyInfo: KeyInfo;
  tags: string[];
  notes: string;
  errorMessage: string;
  aiProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  uploaded: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
