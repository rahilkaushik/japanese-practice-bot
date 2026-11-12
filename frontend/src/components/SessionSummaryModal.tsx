import type { SessionSummary } from '../types';
import CorrectionCard from './CorrectionCard';

interface SessionSummaryModalProps {
  summary: SessionSummary;
  onClose: () => void;
  onNewSession: () => void;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SessionSummaryModal({ summary, onClose, onNewSession }: SessionSummaryModalProps) {
  const handleDownloadAnki = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(summary.csvContent, `japanese-vocab-${date}.txt`, 'text/plain;charset=utf-8');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <div className="modal">
        <div className="modal-header">
          <h2 id="summary-title">📊 Session Summary</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close summary">✕</button>
        </div>

        <div className="modal-body">
          {/* Corrections */}
          <section>
            <div className="section-heading">
              Corrections ({summary.corrections.length})
            </div>
            {summary.corrections.length === 0 ? (
              <p className="summary-empty">No errors — great job! 🎉</p>
            ) : (
              <div className="summary-corrections">
                {summary.corrections.map((c, i) => (
                  <CorrectionCard key={i} correction={{ ...c, had_error: true }} />
                ))}
              </div>
            )}
          </section>

          {/* Vocab */}
          <section>
            <div className="section-heading">
              New Vocabulary ({summary.vocab.length} words)
            </div>
            {summary.vocab.length === 0 ? (
              <p className="summary-empty">No new vocabulary this session.</p>
            ) : (
              <table className="summary-vocab-table">
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>Reading</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.vocab.map((v, i) => (
                    <tr key={i}>
                      <td lang="ja" style={{ fontWeight: 600 }}>{v.word}</td>
                      <td lang="ja" style={{ color: 'var(--text-secondary)' }}>{v.reading}</td>
                      <td>{v.meaning_en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className="modal-footer">
          {summary.vocab.length > 0 && (
            <button className="btn btn-ghost" onClick={handleDownloadAnki} id="download-anki-btn">
              📥 Download Anki CSV
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Continue Session
          </button>
          <button className="btn btn-primary" onClick={onNewSession} id="new-session-btn">
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}
