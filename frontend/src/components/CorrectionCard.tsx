import type { Correction } from '../types';

interface CorrectionCardProps {
  correction: Correction;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  if (!correction.had_error) return null;

  return (
    <div className="correction-card" role="note" aria-label="Grammar correction">
      <div className="correction-card-header">
        <span>✏️</span>
        <span>Correction</span>
      </div>
      <div className="correction-diff">
        <span className="correction-original" lang="ja">{correction.original}</span>
        <span className="correction-arrow">→</span>
        <span className="correction-fixed" lang="ja">{correction.corrected}</span>
      </div>
      <p className="correction-explanation">{correction.explanation_en}</p>
    </div>
  );
}
