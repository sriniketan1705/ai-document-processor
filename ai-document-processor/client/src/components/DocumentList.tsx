import { Link } from 'react-router-dom';
import type { DocumentItem } from '../types';
import { FILE_TYPE_LABEL, formatBytes, formatDate } from '../utils';
import StatusBadge from './StatusBadge';

interface Props {
  documents: DocumentItem[];
  onDelete?: (doc: DocumentItem) => void;
  emptyText?: string;
}

export default function DocumentList({ documents, onDelete, emptyText = 'No documents yet.' }: Props) {
  if (documents.length === 0) return <div className="empty">{emptyText}</div>;

  return (
    <ul className="doc-list">
      {documents.map((doc) => (
        <li key={doc._id} className="doc-row">
          <div className="doc-main">
            <Link to={`/documents/${doc._id}`} className="doc-title">
              {doc.title}
            </Link>
            <span className="muted small">
              {FILE_TYPE_LABEL[doc.fileType]} - {formatBytes(doc.size)} - {formatDate(doc.createdAt)}
            </span>
            {doc.tags.length > 0 && (
              <span className="chips">
                {doc.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="doc-side">
            <StatusBadge status={doc.status} />
            {onDelete && (
              <button className="btn btn-ghost btn-sm danger" onClick={() => onDelete(doc)}>
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
