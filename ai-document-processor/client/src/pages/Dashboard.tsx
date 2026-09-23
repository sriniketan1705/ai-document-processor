import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import DocumentList from '../components/DocumentList';
import UploadForm from '../components/UploadForm';
import { useAuth } from '../context/AuthContext';
import type { DocumentItem, Stats } from '../types';
import { isInProgress } from '../utils';

const EMPTY_STATS: Stats = { total: 0, uploaded: 0, processing: 0, completed: 0, failed: 0 };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [recent, setRecent] = useState<DocumentItem[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([api.get('/documents/stats'), api.get('/documents', { params: { limit: 5 } })]);
      setStats(s.data.stats);
      setRecent(d.data.documents);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // while something is still being processed, refresh every 3 seconds
  useEffect(() => {
    if (!recent.some((d) => isInProgress(d.status))) return;
    const timer = setTimeout(load, 3000);
    return () => clearTimeout(timer);
  }, [recent, load]);

  const inProgress = stats.uploaded + stats.processing;

  return (
    <>
      <h1>Hello, {user?.name.split(' ')[0]}</h1>
      <p className="muted page-sub">Upload a document and DocuLens will read it, summarise it and pull out the key details.</p>

      <UploadForm onUploaded={load} />

      <div className="stats" aria-label="Document statistics">
        <div className="stat">
          <span className="stat-num">{stats.total}</span>
          <span className="muted">Total documents</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.completed}</span>
          <span className="muted">Completed</span>
        </div>
        <div className="stat">
          <span className="stat-num">{inProgress}</span>
          <span className="muted">In progress</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.failed}</span>
          <span className="muted">Failed</span>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="section-head">
        <h2>Recent documents</h2>
        <Link to="/documents">View all</Link>
      </div>
      <div className="panel">
        {loaded ? (
          <DocumentList documents={recent} emptyText="Nothing here yet. Upload your first document above." />
        ) : (
          <div className="empty">Loading...</div>
        )}
      </div>
    </>
  );
}
