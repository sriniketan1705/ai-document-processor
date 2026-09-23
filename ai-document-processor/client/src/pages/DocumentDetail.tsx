import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import type { DocumentItem } from '../types';
import { FILE_TYPE_LABEL, formatBytes, formatDate, isInProgress } from '../utils';

interface FormState {
  title: string;
  summary: string;
  tags: string; // comma separated in the input, converted to an array on save
  notes: string;
}

const toForm = (d: DocumentItem): FormState => ({
  title: d.title,
  summary: d.summary,
  tags: d.tags.join(', '),
  notes: d.notes,
});

function InfoGroup({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="info-group">
      <h3>{label}</h3>
      <div className="chips">
        {items.map((item) => (
          <span key={item} className="chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [form, setForm] = useState<FormState>({ title: '', summary: '', tags: '', notes: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data.document);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // fill the edit form on first load and whenever processing finishes (new summary)
  useEffect(() => {
    if (doc) setForm(toForm(doc));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?._id, doc?.status]);

  useEffect(() => {
    if (!doc || !isInProgress(doc.status)) return;
    const timer = setTimeout(load, 2500);
    return () => clearTimeout(timer);
  }, [doc, load]);

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title cannot be empty.');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await api.put(`/documents/${id}`, { title: form.title, summary: form.summary, notes: form.notes, tags });
      setDoc(res.data.document);
      setMessage('Changes saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    setError('');
    setMessage('');
    try {
      const res = await api.post(`/documents/${id}/reprocess`);
      setDoc(res.data.document);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await api.delete(`/documents/${id}`);
      navigate('/documents');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // the file endpoint needs the JWT header, so we download it as a blob instead of a plain link
  const handleDownload = async () => {
    if (!doc) return;
    try {
      const res = await api.get(`/documents/${id}/file`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!loaded) return <div className="empty">Loading...</div>;
  if (!doc)
    return (
      <>
        <p className="error">{error || 'Document not found.'}</p>
        <Link to="/documents">Back to documents</Link>
      </>
    );

  const info = doc.keyInfo;
  const busy = isInProgress(doc.status);

  return (
    <>
      <Link to="/documents" className="back">
        Back to documents
      </Link>

      <div className="detail-head">
        <div>
          <h1>{doc.title}</h1>
          <p className="muted small">
            {doc.originalName} - {FILE_TYPE_LABEL[doc.fileType]} - {formatBytes(doc.size)} - uploaded{' '}
            {formatDate(doc.createdAt)}
          </p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <div className="actions">
        <button className="btn btn-ghost btn-sm" onClick={handleDownload}>
          Download original
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleReprocess} disabled={busy}>
          Process again
        </button>
        <button className="btn btn-ghost btn-sm danger" onClick={handleDelete}>
          Delete
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {busy && <div className="notice">Reading your document. This page updates by itself when it is done.</div>}
      {doc.status === 'failed' && (
        <div className="notice notice-error">
          <strong>Processing failed.</strong> {doc.errorMessage || 'Unknown error.'}
        </div>
      )}

      <div className="detail-grid">
        <section className="panel pad">
          <h2>Details</h2>
          <label>
            Title
            <input className="input" value={form.title} onChange={setField('title')} maxLength={120} />
          </label>
          <label>
            Summary
            <textarea className="input" rows={6} value={form.summary} onChange={setField('summary')} />
          </label>
          <label>
            Tags (separate with commas)
            <input className="input" value={form.tags} onChange={setField('tags')} placeholder="invoice, 2025, client" />
          </label>
          <label>
            Notes
            <textarea className="input" rows={3} value={form.notes} onChange={setField('notes')} />
          </label>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </section>

        <section className="panel pad">
          <h2>Extracted information</h2>
          {doc.status !== 'completed' ? (
            <p className="muted">Nothing extracted yet.</p>
          ) : (
            <>
              {info.documentType && (
                <div className="info-group">
                  <h3>Document type</h3>
                  <p>{info.documentType}</p>
                </div>
              )}
              {info.keyPoints.length > 0 && (
                <div className="info-group">
                  <h3>Key points</h3>
                  <ul className="points">
                    {info.keyPoints.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              <InfoGroup label="People" items={info.people} />
              <InfoGroup label="Organizations" items={info.organizations} />
              <InfoGroup label="Emails" items={info.emails} />
              <InfoGroup label="Phone numbers" items={info.phones} />
              <InfoGroup label="Dates" items={info.dates} />
              <InfoGroup label="Amounts" items={info.amounts} />
              <p className="muted small">
                {doc.aiProvider === 'local'
                  ? 'Summary made by the built-in summariser. Add an AI API key on the server for better results.'
                  : `Summary generated with ${doc.aiProvider}.`}
              </p>
            </>
          )}
        </section>
      </div>

      {doc.extractedText && (
        <details className="panel pad text-block">
          <summary>Extracted text ({doc.extractedText.length.toLocaleString()} characters)</summary>
          <pre>{doc.extractedText}</pre>
        </details>
      )}
    </>
  );
}
