import { DragEvent, FormEvent, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { formatBytes } from '../utils';

const MAX_MB = 10;
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];

export default function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | undefined) => {
    setError('');
    if (!f) return;
    if (!ALLOWED.includes(f.type)) return setError('Only PDF, PNG, JPG and TXT files are supported.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File is larger than ${MAX_MB} MB.`);
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Choose a file first.');

    const data = new FormData();
    data.append('file', file);
    if (title.trim()) data.append('title', title.trim());

    setUploading(true);
    setError('');
    try {
      await api.post('/documents', data);
      setFile(null);
      setTitle('');
      if (inputRef.current) inputRef.current.value = '';
      onUploaded();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="panel upload" onSubmit={onSubmit}>
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {file ? (
          <>
            <strong>{file.name}</strong>
            <span className="muted">{formatBytes(file.size)} - ready to upload</span>
          </>
        ) : (
          <>
            <strong>Drop a document here, or click to browse</strong>
            <span className="muted">PDF, PNG, JPG or TXT, up to {MAX_MB} MB</span>
          </>
        )}
      </div>

      <div className="upload-row">
        <input
          className="input"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <button className="btn btn-primary" type="submit" disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload and process'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
