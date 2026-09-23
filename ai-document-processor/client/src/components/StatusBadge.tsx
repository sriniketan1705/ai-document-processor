import type { DocStatus } from '../types';

const LABELS: Record<DocStatus, string> = {
  uploaded: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export default function StatusBadge({ status }: { status: DocStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}
