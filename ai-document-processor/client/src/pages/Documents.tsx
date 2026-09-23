import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import DocumentList from '../components/DocumentList';
import type { DocumentItem, Pagination } from '../types';
import { isInProgress } from '../utils';

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fileType, setFileType] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // wait until the user stops typing before calling the API
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/documents', {
        params: { search: debouncedSearch, status, fileType, sort, page, limit: 10 },
      });
      setDocuments(res.data.documents);
      setPagination(res.data.pagination);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, [debouncedSearch, status, fileType, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!documents.some((d) => isInProgress(d.status))) return;
    const timer = setTimeout(load, 3000);
    return () => clearTimeout(timer);
  }, [documents, load]);

  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${doc._id}`);
      // if we deleted the last item on this page, go back one page
      if (documents.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const changeFilter = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const hasFilters = Boolean(debouncedSearch || status || fileType);

  return (
    <>
      <h1>Documents</h1>
      <p className="muted page-sub">Search across titles, summaries, tags and the extracted text.</p>

      <div className="filters">
        <input
          className="input grow"
          type="search"
          placeholder="Search documents"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={changeFilter(setStatus)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="uploaded">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select className="input" value={fileType} onChange={changeFilter(setFileType)} aria-label="Filter by type">
          <option value="">All types</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
          <option value="text">Text</option>
        </select>
        <select className="input" value={sort} onChange={changeFilter(setSort)} aria-label="Sort order">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="panel">
        {loaded ? (
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            emptyText={hasFilters ? 'No documents match these filters.' : 'No documents yet. Upload one from the dashboard.'}
          />
        ) : (
          <div className="empty">Loading...</div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="muted small">
            Page {pagination.page} of {pagination.pages} ({pagination.total} documents)
          </span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </>
  );
}
