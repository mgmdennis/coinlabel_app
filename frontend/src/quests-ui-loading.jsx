// Coin-flip loading state shared by the quest pages — a little denarius
// flipping head-over-tail while data loads (1.6s per turn, reading as
// "thinking" rather than thrashing). Dark-coin obverse / light reverse.
export const QuestLoading = ({ hint = 'Reading the cabinet…', dark = false }) => (
  <div className="q-root">
    <div className="q-loading" role="status" aria-live="polite">
      <div className={`q-coin-flip${dark ? ' q-coin-flip-dark' : ''}`} aria-hidden="true" />
      <span className="q-loading-hint">{hint}</span>
    </div>
  </div>
);
