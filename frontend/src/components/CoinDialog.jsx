import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BASE_URL } from '../config';
import '../quests.css';
import { Icon, coinPlaceholder } from '../quests-ui';

const bareBustOf = (c) => String(c?.details || '').match(/bust\s+of\s+([^,\n.]+)/i)?.[1]?.replace(/\s+(right|left|facing|bareheaded|laureate|diademed|draped|cuirassed|veiled|helmeted)\b.*$/i, '').trim();

// Coin popup — the concept's view-coin dialog with the full review flow:
// the amber callout names why the coin is parked and offers one-click
// "Confirm as <name>" (rewrites the card's attribution line + issuer,
// certainty on) or a small edit-attribution form, both through the real
// update endpoint. Parents refresh through `onChanged` so the quest recount
// is immediate; the detail page listens for quest completion (award).
const coinImageUrl = (coin, side) => {
  const version = (side === 'obv' ? coin.obvImageVersion : coin.revImageVersion) || '';
  return `${BASE_URL}/coin/${coin._id}/image/${side}?v=${encodeURIComponent(version)}`;
};

const CoinFace = ({ coin, side }) => (
  <span className="q-coin-face">
    <img
      className="q-coin-img"
      src={coin[side === 'obv' ? 'hasObvImage' : 'hasRevImage'] ? coinImageUrl(coin, side) : coinPlaceholder(coin, side)}
      alt={`${side === 'obv' ? 'Obverse' : 'Reverse'}`}
      onError={(e) => { e.currentTarget.src = coinPlaceholder(coin, side); }}
      loading="lazy"
    />
    <span className="q-coin-face-label">{side === 'obv' ? 'Obverse' : 'Reverse'}</span>
  </span>
);

const Fact = ({ label, value }) => (
  <div className="q-fact">
    <dt>{label}</dt>
    <dd>{value || '—'}</dd>
  </div>
);

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Attribution helpers — the label's claim lives in the composed details:
// "Ruler: <name>" first line ("Issuer:" / "(name)" on legacy coins). A
// trailing "?" marks uncertainty; confirming clears the question mark.
const claimOf = (details, fallback) => {
  const text = String(details || '');
  const m = /^Ruler:\s*([^\n]+)/m.exec(text) ||
    /^Issuer:\s*([^\n]+)/m.exec(text) ||
    /^\(([^)\n]+)\)/m.exec(text);
  return m ? m[1].trim().replace(/\s*—.*$/, '') : (fallback || '');
};

// Confirm write-back:
//  - ambiguous bust ("Bust of Faustina", Mark 2026-10-31): edit the bust
//    phrase in place — "Bust of Faustina" → "Bust of Faustina the Younger".
//    The label then says exactly what the coin is; Ruler: and issuer stay
//    untouched (an empress is never the ruler).
//  - an uncertain claim ("Nero?"): clear the "?" on the Ruler: line and
//    keep the stored issuer in step.
const writeBustFix = (details, from, to) => {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b(?!\\s+(?:the\\s+)?(?:Elder|Younger|Senior|Junior|Major|Minor))`, 'i');
  return String(details || '').replace(re, to.trim());
};
const writeClaim = (details, name, uncertain) => {
  const safeName = `${name.trim()}${uncertain ? '?' : ''}`;
  const text = String(details || '');
  let rest = text;
  for (const re of [/^Ruler:\s*[^\n]+\n?/m, /^\(.*?\)/m]) {
    if (re.test(text)) { rest = text.replace(re, ''); break; }
  }
  rest = rest.replace(/^Issuer:\s*[^\n]+\n?/m, '');
  return `Ruler: ${safeName}\n${rest}`.trim();
};

const MatchItem = ({ match, showReason, onMakeCounting, busy }) => (
  <div className="q-match-item">
    <div className="q-match-top">
      <p className="q-match-quest">
        <Icon name={match.status === 'review' ? 'alert' : 'check'} size={14} />
        {match.questTitle}
      </p>
      <span className={`q-chip ${match.status === 'review' ? 'q-chip-review' : 'q-chip-complete'}`}>
        {match.status === 'review' ? 'Needs review' : 'Collected'}
      </span>
    </div>
    <p className="q-match-req">{match.name}</p>
    {showReason && match.matchReason && (
      <p className="q-reason"><Icon name="info" size={13} /><span>{match.matchReason}</span></p>
    )}
    {match.status === 'collected' && !match.counted && (
      <button
        className="q-pick-make"
        type="button"
        disabled={busy}
        onClick={() => onMakeCounting?.(match.questId, match.requirementId)}
      >
        Make this the counting coin
      </button>
    )}
  </div>
);

const CoinDialog = ({ coinId, onClose, onChanged }) => {
  const ref = useRef(null);
  const [coin, setCoin] = useState(null);
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUncertain, setEditUncertain] = useState(false);
  const [flash, setFlash] = useState('');
  // Same-coin refresh guard — a late save-refresh must never land on a
  // dialog that has been re-opened for a different coin.
  const coinIdRef = useRef(coinId);
  coinIdRef.current = coinId;
  // Hooks MUST all come before the early `if (!coinId) return null` below —
  // one after it makes React fail the render and kills the dialog open.
  const [pickBusy, setPickBusy] = useState(false);

  const fetchData = useCallback(() => {
    if (!coinId) return;
    axios.get(`${BASE_URL}/coin/${coinId}?view=summary`).then((res) => {
      if (coinIdRef.current === coinId) setCoin(res.data);
    }).catch(() => {});
    axios.get(`${BASE_URL}/quests?coin=${coinId}`).then((res) => {
      if (coinIdRef.current === coinId) setMatches(res.data);
    }).catch(() => { if (coinIdRef.current === coinId) setMatches([]); });
  }, [coinId]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !coinId) return undefined;
    dialog.showModal();
    dialog.addEventListener('cancel', (e) => e.preventDefault());
    return () => { if (dialog.open) dialog.close(); };
  }, [coinId]);

  // Fresh view per coin — without this the dialog paints the PREVIOUS
  // coin's data for a beat while the new fetch is in flight (its state
  // persists because the dialog stays mounted when closed).
  useEffect(() => {
    let live = true;
    setCoin(null);
    setMatches(null);
    if (coinId) {
      axios.get(`${BASE_URL}/coin/${coinId}?view=summary`).then((res) => {
        if (live) setCoin(res.data);
      }).catch(() => {});
      axios.get(`${BASE_URL}/quests?coin=${coinId}`).then((res) => {
        if (live) setMatches(res.data);
      }).catch(() => { if (live) setMatches([]); });
    }
    return () => { live = false; };
  }, [coinId]);

  const reattribute = async (name, uncertain) => {
    setBusy(true);
    setFlash('');
    try {
      // Ambiguous-bust confirm ("Confirm as Faustina the Younger" on a bare
      // "Bust of Faustina"): edit the bust phrase in place. The label then
      // states the depicted person; the issuing claim stays untouched.
      const from = bareBustOf(coin) || '';
      const isBustFix = !uncertain && from && ['faustina', 'diva faustina'].includes(from.toLowerCase());
      const body = isBustFix
        ? { details: writeBustFix(coin?.details, from, name) }
        : { details: writeClaim(coin?.details, name, uncertain), issuer: uncertain ? `${name}?` : name };
      console.log('attribution save attempt', { coinId, body });
      await axios.put(`${BASE_URL}/coin/update/${coinId}`, body);
      setEditing(false);
      setFlash(`Attribution set to "${name.trim()}${uncertain ? '?' : ''}" — quests recounted.`);
      fetchData();
      onChanged?.();
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.error || err?.message || 'unknown error';
      setFlash(`Could not save the attribution (${status || 'no response'}: ${detail}).`);
      console.error('attribution update failed', { coinId, name, status, detail, err });
    }
    setBusy(false);
  };

  // Confirm-as: a single click that claims the coin for the pending slot's
  // person — attribution line rewritten, certainty on (the review's whole
  // point). Generic form clears the "?" uncertainty in place.
  const handleConfirmAs = (name) => reattribute(name, false);
  const handleConfirmKnown = () => {
    const claim = claimOf(coin?.details, coin?.issuer).replace(/\?+$/, '');
    reattribute(claim, false);
  };

  const startEdit = () => {
    setEditName(claimOf(coin?.details, coin?.issuer).replace(/\?+$/, ''));
    setEditUncertain(/\?/.test(claimOf(coin?.details, coin?.issuer)));
    setEditing(true);
  };

  if (!coinId) return null;
  const loading = coin === null;
  const reviewMatches = (matches ?? []).filter((m) => m.status === 'review');
  const collected = (matches ?? []).filter((m) => m.status === 'collected');
  // A review whose uncertainty came from the label's own "?" (the claim
  // matches the slot) is a one-click confirm of the recorded claim rather
  // than "confirm as <someone else>".
  const currentClaim = coin ? claimOf(coin.details, coin.issuer) : '';
  const claimUncertain = /\?/.test(currentClaim);

  // "Make this the counting coin" — hoist THIS coin into a quest slot it
  // qualifies for but currently only alternates toward. The pick is stored
  // server-side and recounted via onChanged.
  const handleMakeCounting = (questId, requirementId) => {
    setPickBusy(true);
    axios.post(`${BASE_URL}/quests/pick`, { coinId, questId, requirementId, remove: false })
      .then(() => {
        fetchData();
        onChanged?.();
      })
      .catch((err) => {
        console.error('quest pick failed', err?.response?.status, err?.response?.data?.error || err.message);
      })
      .finally(() => setPickBusy(false));
  };

  return (
    <dialog className="q-dialog" ref={ref} aria-labelledby="q-coin-dialog-title">
      <div className="q-dialog-head">
        <div>
          <p className="q-eyebrow">Cabinet coin</p>
          <h2 id="q-coin-dialog-title" tabIndex={-1}>{loading ? 'Loading…' : (coin?.issuer || 'Coin')}</h2>
          <p className="q-dialog-sub">{coin ? [coin.denomination, coin.year].filter(Boolean).join(' · ') : ''}</p>
        </div>
        <button className="q-icon-btn" type="button" onClick={onClose} aria-label="Close coin details">✕</button>
      </div>

      <div className="q-dialog-scroll">
        {loading && (
          <div className="q-dialog-loading" role="status">
            <div className="q-coin-flip" aria-hidden="true" />
            <span className="q-loading-hint">Fetching the coin…</span>
          </div>
        )}

        {coin && (
          <>
            {flash && (
              <div className="q-callout q-callout--neutral" role="status">
                <p className="q-callout-label"><Icon name="info" size={15} />Attribute</p>
                <p>{flash}</p>
              </div>
            )}

            {/* review callout — the concept's confirm-attribution flow */}
            {reviewMatches.length > 0 && !editing && (
              <div className="q-callout">
                <p className="q-callout-label"><Icon name="alert" size={15} />Attribution needs review</p>
                {reviewMatches.map((m) => (
                  <div key={`${m.questId}-${m.name}`} className="q-callout-review-row">
                    <p>
                      This coin could satisfy <strong>{m.questTitle} — {m.name}</strong>, but it is not counted yet.
                    </p>
                    {m.matchReason && <p className="q-callout-reason">{m.matchReason}</p>}
                    {claimUncertain ? (
                      <div className="q-callout-actions">
                        <button className="q-btn-outline" type="button" disabled={busy} onClick={handleConfirmKnown}>
                          Confirm attribution
                        </button>
                      </div>
                    ) : (
                      <div className="q-callout-actions">
                        <button className="q-btn-outline" type="button" disabled={busy} onClick={() => handleConfirmAs(m.name)}>
                          Confirm as {m.name}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="q-callout-actions">
                  <button className="q-btn-outline-blue" type="button" disabled={busy} onClick={startEdit}>
                    Edit attribution
                  </button>
                </div>
              </div>
            )}
            {!reviewMatches.length && collected.length === 0 && matches !== null && !editing && (
              <div className="q-callout q-callout--neutral">
                <p className="q-callout-label"><Icon name="info" size={15} />No quest match</p>
                <p>None of the Roman Imperial Quests currently recognize this coin as a named slot through attribution, portrait, or OCRE range.</p>
                <div className="q-callout-actions">
                  <button className="q-btn-outline" type="button" disabled={busy} onClick={startEdit}>Set attribution</button>
                </div>
              </div>
            )}

            {coin && editing && (
              <form
                className="q-callout q-callout--edit"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editName.trim()) reattribute(editName.trim(), editUncertain);
                }}
              >
                <p className="q-callout-label"><Icon name="check" size={15} />Attribution</p>
                <p>Who does this coin belong to? The label's Ruler line is what the quests read.</p>
                <div className="q-edit-field">
                  <input
                    className="q-search-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Julia Domna"
                    autoFocus
                    aria-label="Attribution name"
                  />
                  <label className="q-edit-uncertain">
                    <input
                      type="checkbox"
                      checked={editUncertain}
                      onChange={(e) => setEditUncertain(e.target.checked)}
                    />
                    Mark uncertain (adds a "?" — stays uncounted until confirmed)
                  </label>
                </div>
                <div className="q-callout-actions">
                  <button className="q-btn-outline-blue" type="submit" disabled={busy || !editName.trim()}>
                    Save attribution
                  </button>
                  <button className="q-btn-outline" type="button" disabled={busy} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <section className="q-dialog-section" style={{ marginTop: editing ? 20 : 0 }}>
              <h3>Coin details</h3>
              <div className="q-dialog-face-row">
                <CoinFace coin={coin} side="obv" />
                <CoinFace coin={coin} side="rev" />
              </div>
              <dl className="q-facts">
                <Fact label="Issuer" value={coin.issuer} />
                <Fact label="Attribution" value={claimUncertain ? 'Uncertain — needs confirmation' : 'Certain'} />
                <Fact label="Denomination" value={coin.denomination} />
                <Fact label="Year" value={coin.year} />
                <Fact label="Grade" value={coin.grade} />
                <Fact label="Reference" value={coin.reference} />
                <Fact label="OCRE ID" value={coin.ocreId} />
                <Fact label="Acquired" value={coin.acquired || (coin.createdAt ? formatDate(coin.createdAt) : null)} />
              </dl>
            </section>

            {coin.note && (
              <section className="q-dialog-section">
                <h3>Notes</h3>
                <p className="q-dialog-copy">{coin.note}</p>
              </section>
            )}

            {matches !== null && matches.length > 0 && (
              <section className="q-dialog-section">
                <h3>Quest matches</h3>
                <div className="q-match-list">
                  {matches.map((m) => <MatchItem key={`${m.questId}-${m.name}`} match={m} showReason onMakeCounting={handleMakeCounting} busy={pickBusy} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <div className="q-dialog-foot">
        {coin && <Link className="q-btn-outline-blue" to={`/item/${coin._id}`} onClick={onClose}>Open full page ↗</Link>}
        <button className="q-btn-outline-blue" type="button" onClick={onClose}>Done</button>
      </div>
    </dialog>
  );
};

export default CoinDialog;
