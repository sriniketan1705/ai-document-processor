export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const FILE_TYPE_LABEL = { pdf: 'PDF', image: 'Image', text: 'Text' } as const;

// used for polling: while a document is still being worked on we keep refreshing
export const isInProgress = (status: string) => status === 'uploaded' || status === 'processing';
