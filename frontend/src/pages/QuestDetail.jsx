import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Text } from '@mantine/core';

import { BASE_URL } from '../config';
import CoinDialog from '../components/CoinDialog';
import '../quests.css';
import { QuestLoading } from '../quests-ui-loading';
import {
  Bar, Chip, Icon, QuestError, Seal, ProgressRing, badgeNameFor, coinPlaceholder, statusLabel,
} from '../quests-ui';

// Roman Imperial Quests — quest detail. Concept structure: detail copy +
// dark Quest Progress card, complete banner (opens the award dialog), then
// a two-column body — a sticky "How this quest is checked" rules rail and
// one bordered Requirements card (pills in its header) whose rows are
// number-circle · main · action. Every Emperor renders its eight dynastic
// sections as details/summary groups.

const percentOf = (quest) =>
  quest.progress.total ? Math.round((quest.progress.collected / quest.progress.total) * 100) : 0;

const coinImageUrl = (coin, side) => {
  const version = (side === 'obv' ? coin.obvImageVersion : coin.revImageVersion) || '';
  return `${BASE_URL}/coin/${coin._id}/image/${side}?v=${encodeURIComponent(version)}`;
};

const coinSummary = (coin) =>
  [coin.denomination, coin.year].filter(Boolean).join(' · ');

const CoinFace = ({ coin, side }) => (
  <span className="q-coin-face">
    <img
      className="q-coin-img"
      src={coin[side === 'obv' ? 'hasObvImage' : 'hasRevImage'] ? coinImageUrl(coin, side) : coinPlaceholder(coin, side)}
      alt={`${side === 'obv' ? 'Obverse' : 'Reverse'} photo`}
      onError={(e) => { e.currentTarget.src = coinPlaceholder(coin, side); }}
      title={side === 'obv' ? 'Obverse' : 'Reverse'}
      loading="lazy"
    />
    <span className="q-coin-face-label">{side === 'obv' ? 'Obverse' : 'Reverse'}</span>
  </span>
);

const CoinFaces = ({ coin }) => (
  <span className="q-coin-faces">
    <CoinFace coin={coin} side="obv" />
    <CoinFace coin={coin} side="rev" />
  </span>
);

const CHIP_BY_STATUS = {
  collected: { label: 'Collected', icon: 'circle-check', chip: 'q-chip-complete' },
  review: { label: 'Needs review', icon: 'alert', chip: 'q-chip-review' },
  needed: { label: 'Still needed', icon: 'circle', chip: 'q-chip-missing' },
};

const reqFilterButton = (kind, label, count, current, setFilter) => (
  <button
    className="q-filter-btn"
    type="button"
    aria-pressed={current === kind}
    onClick={() => setFilter(kind)}
  >
    <span>{label}</span><span className="q-filter-count">{count}</span>
  </button>
);

// Pick strip — "pick the piece for this collection" (Mark 2026-11-04):
// when several coins qualify for a slot, every one of the alternates is
// offered; clicking makes it the counting coin, "Return to auto" clears the
// pick and the engine resumes its own preference.
// Pick affordance — deliberately one quiet line in the row (Mark): the
// candidates themselves open in a picker modal instead of crowding the row.
const PickLine = ({ req, questId, onOpenPick, busy }) => {
  const chosenId = String(req.coin._id ?? req.coin.id);
  const others = (req.candidates ?? []).filter((c) => String(c.id) !== chosenId);
  const n = others.length;
  if (n === 0 && !req.picked) return null;
  return (
    <p className="q-alternate q-pick-line">
      {req.picked ? (
        <>
          <Icon name="check" size={13} />
          <span>Counts the coin you picked.</span>
        </>
      ) : (
        <span>{n === 1 ? 'Another coin also qualifies.' : `${n} other coins also qualify.`}</span>
      )}
      <button className="q-pick-open" type="button" disabled={busy} onClick={() => onOpenPick(questId, req)}>
        {req.picked ? 'change which counts' : 'choose the counting coin'}
      </button>
    </p>
  );
};

// The picker modal — one row per qualifying coin, the counting coin first.
const PickDialog = ({ pickTarget, onClose, onPick, onClearPick, busy }) => {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (pickTarget) {
      dialog.showModal();
      dialog.addEventListener('cancel', (e) => e.preventDefault());
    }
    return () => { if (dialog.open) dialog.close(); };
  }, [pickTarget]);

  if (!pickTarget) return null;
  const { questId, req } = pickTarget;
  const chosenId = String(req.coin._id ?? req.coin.id);
  const chosen = (req.candidates ?? []).find((c) => String(c.id) === chosenId);
  return (
    <dialog className="q-dialog q-pick-dialog" ref={ref} aria-labelledby="q-pick-title">
      <div className="q-dialog-head">
        <div>
          <p className="q-eyebrow">Pick the piece</p>
          <h2 id="q-pick-title" tabIndex={-1}>{req.name}</h2>
        </div>
        <button className="q-icon-btn" type="button" onClick={onClose} aria-label="Close picker">✕</button>
      </div>
      <div className="q-dialog-scroll">
        <p className="q-pick-counts">
          {req.picked ? 'Counting the coin you picked.' : 'Counting the recommended coin.'} All coins below match this slot; only one can count.
        </p>
        <div className="q-pick-list">
          {[chosen, ...(req.candidates ?? []).filter((c) => String(c.id) !== chosenId)].map((c) => (
            <div key={c.id} className="q-pick-row">
              {c.hasObvImage ? (
                <img
                  className="q-pick-thumb"
                  src={`${BASE_URL}/coin/${c.id}/image/obv`}
                  alt=""
                  loading="lazy"
                  width={38}
                  height={38}
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
              ) : <span className="q-pick-blank" aria-hidden="true">·</span>}
              <span className="q-pick-meta">
                <strong>{[c.issuer, c.denomination].filter(Boolean).join(' · ')}</strong>
                {c.year && <em>{String(c.year)}</em>}
              </span>
              {String(c.id) === chosenId ? (
                <span className="q-chip q-chip-complete"><Icon name="check" size={13} />Counting</span>
              ) : (
                <button className="q-btn-outline" type="button" disabled={busy} onClick={() => onPick(c.id, questId, req.id)}>
                  Count this
                </button>
              )}
            </div>
          ))}
        </div>
        {req.picked && (
          <button className="q-pick-auto" type="button" disabled={busy} onClick={() => onClearPick(questId, req.id)}>
            Use the recommended coin instead
          </button>
        )}
      </div>
      <div className="q-dialog-foot">
        <button className="q-btn-outline-blue" type="button" onClick={onClose}>Done</button>
      </div>
    </dialog>
  );
};

const ReqRow = ({ req, questId, index, total, onOpenCoin, onOpenPick, onClearPick, pickBusy }) => {
  const meta = CHIP_BY_STATUS[req.status];
  return (
    <article className={`q-req-row q-req-row--${req.status}`} id={`req-${req.name}`}>
      <div className="q-req-marker" aria-hidden="true">
        <span className="q-req-num">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="q-req-main">
        <div className="q-req-topline">
          <div className="q-req-title-group">
            <h3>{req.name}</h3>
            {req.reign && <span className="q-reign">{req.reign}</span>}
          </div>
          <span className={`q-chip ${meta.chip}`}>
            <Icon name={meta.icon} size={13} />
            {meta.label}
          </span>
        </div>

        {req.status === 'collected' && req.coin && (
          <div className="q-req-coin">
            <CoinFaces coin={req.coin} />
            <div style={{ minWidth: 0 }}>
              <p className="q-match-line"><Icon name="circle-check" size={17} /><span>{[req.coin.issuer, coinSummary(req.coin)].filter(Boolean).join(' — ')}</span></p>
              <p className="q-reason"><Icon name="info" size={14} /><span>{req.matchReason}</span></p>
              <PickLine req={req} questId={questId} onOpenPick={onOpenPick} onClearPick={onClearPick} busy={pickBusy} />
            </div>
          </div>
        )}

        {req.status === 'review' && req.coin && (
          <div className="q-req-coin">
            <CoinFaces coin={req.coin} />
            <div className="q-review-box" style={{ flex: 1, minWidth: 0 }}>
              <p className="q-review-label"><Icon name="alert" size={14} />Possible match — not counted</p>
              <p className="q-review-coin">{[req.coin.issuer, coinSummary(req.coin)].filter(Boolean).join(' · ')}</p>
              <p className="q-reason"><Icon name="info" size={14} /><span>{req.matchReason}</span></p>
            </div>
          </div>
        )}

        {req.status === 'needed' && (
          <>
            <p className="q-missing-lead">No matching coin in your cabinet yet.</p>
            <p className="q-qualify">{req.explanation}</p>
          </>
        )}
      </div>
      <div className="q-req-action">
        {(req.status === 'collected' || req.status === 'review') && req.coin && (
          <button
            className={`q-btn-outline${req.status === 'review' ? '-blue' : ''}`}
            type="button"
            onClick={() => onOpenCoin(req.coin._id)}
          >
            {req.status === 'review' ? 'Review coin' : 'View coin'}
          </button>
        )}
        {req.status === 'needed' && (
          <Link className="q-btn-outline" to="/create">Record a coin</Link>
        )}
      </div>
    </article>
  );
};

const AwardDialog = ({ quest, quests, open, onClose }) => {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open) {
      dialog.showModal();
      dialog.addEventListener('cancel', (e) => e.preventDefault());
    }
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  if (!open || !quest) return null;
  const questsComplete = (quests ?? []).filter((q) => q.progress.complete).length;
  const coins = quest.requirements
    .filter((r) => r.status === 'collected' && r.coin && r.coin.hasObvImage)
    .slice(0, 10)
    .map((r) => r.coin);

  return (
    <dialog className="q-dialog q-award-dialog" ref={ref} aria-labelledby="q-award-title">
      <div className="q-dialog-head">
        <div>
          <p className="q-eyebrow">Quest complete</p>
          <h2 id="q-award-title" tabIndex={-1}>{quest.title}</h2>
        </div>
        <button className="q-icon-btn" type="button" onClick={onClose} aria-label="Close award">✕</button>
      </div>
      <div className="q-dialog-scroll q-award-body">
        <Seal badge={quest.badge} earned size={132} />
        <p className="q-award-badge-name">{badgeNameFor(quest)} badge</p>
        <p className="q-award-copy">
          Every requirement is now represented in your cabinet. The badge stays
          with the quest while it remains complete.
        </p>
        {coins.length > 0 && (
          <div className="q-award-coins">
            {coins.map((coin) => (
              <img
                key={coin._id}
                className="q-coin-img"
                src={coinImageUrl(coin, 'obv')}
                alt=""
                loading="lazy"
                width={44}
                height={44}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ))}
          </div>
        )}
        <div className="q-award-stats">
          <div className="q-award-stat">
            <strong>{quest.progress.collected}</strong>
            <span>{quest.unit} collected</span>
          </div>
          <div className="q-award-stat">
            <strong>{questsComplete}</strong>
            <span>quests complete</span>
          </div>
        </div>
      </div>
      <div className="q-dialog-foot q-dialog-foot-split">
        <button className="q-btn-outline" type="button" onClick={() => { onClose(); navigate('/quests'); }}>
          Back to quests
        </button>
        <button className="q-btn-outline-blue" type="button" onClick={onClose}>View quest</button>
      </div>
    </dialog>
  );
};

// Per-quest rules copy — the rail speaks each quest's own checkers
// (Mark 2026-11-03). Mirrors the engine contract in
// backend/quests/conceptData.js + questMatcher.js — update both together.
const RULES_RULER = [
  'Issuer names and curated aliases are matched exactly. "Trajan Decius" does not match "Trajan".',
  'The obverse portrait decides: a "Bust of / Head of <ruler>" line outranks the recorded claim.',
  'OCRE IDs inside this quest’s accepted RIC ranges also satisfy a requirement.',
];
const RULES_TYPED = [
  'Slots are matched from the recorded coin facts — not from ruler names.',
];
const RULES_BY_QUEST = {
  'five-good': [
    'Issuer names and curated aliases are matched exactly.',
    'The obverse portrait decides: a "Bust of / Head of <ruler>" line outranks the recorded claim.',
    'OCRE IDs inside each slot’s accepted RIC ranges (ric.2.ner., ric.2.tr., ric.2_3(2).hdn., ric.3.ant., ric.3.m_aur.) fill the slot even when the issuer line is vague.',
  ],
  'twelve-caesars': [
    'Issuer names and curated aliases are matched exactly. "Trajan Decius" does not match "Trajan".',
    'The obverse portrait outranks the recorded claim.',
    'OCRE IDs are not evaluated here — the claim or the portrait must name the ruler.',
  ],
  'year-of-four': [
    'Each slot reads the recorded claim (issuer, alias) or the obverse portrait.',
    'One coin per man who was raised and discarded in a single year of civil war.',
  ],
  'julio-claudians': [
    'Issuer names and curated aliases are matched exactly.',
    'The obverse portrait outranks the recorded claim — an Augustus portrait under any issuing line stays an Augustus slot.',
  ],
  'flavians': [
    'Issuer names and curated aliases are matched exactly.',
    'The obverse portrait outranks the recorded claim.',
  ],
  'severans': [
    'Issuer names and curated aliases are matched exactly.',
    'The obverse portrait outranks the recorded claim.',
    'Empresses inside their husbands’ series (Julia Domna under ric.4.ss) count for the women’s quest, never for the emperor here.',
  ],
  'soldier-emperors': [
    'Issuer names and curated aliases are matched exactly.',
    'The obverse portrait outranks the recorded claim.',
    'Postumus also fills his slot from ric.5.post. OCRE IDs — a Gallic coin whose issuer line is vague still counts.',
  ],
  'constantinians': [
    'Issuer names and curated aliases are matched exactly.',
    'The obverse portrait outranks the recorded claim — a Crispus bust never credits Constantine.',
  ],
  'every-emperor': [
    'Each of the eighty slots reads the recorded claim (issuer, alias) or the obverse portrait.',
    'OCRE IDs are not used in this quest — the claim or the portrait must name the ruler.',
    'The run is grouped into the dynasty sections shown below; a slot belongs to the section covering its reign.',
  ],
  'imperial-women': [
    'The portrait owns the slot: the "Bust of <empress>" line decides which woman a coin counts for.',
    'A bare "Faustina" / "Diva Faustina" bust reviews on both Faustina slots until you confirm which empress it is.',
    'Confirm-as rewrites the bust phrase on the label itself, so the card says exactly who is depicted.',
  ],
  'four-metals': [
    'Slots read the coin’s metal, derived from the recorded denomination: AV aureus and solidus are gold, AR denarius and antoninianus are silver, Æ Ae1–Ae4 and sestertius are bronze.',
    'When the denomination is silent, the composition field decides — bronze, orichalcum, or copper all count as bronze.',
    'Ruler names don’t matter: any era, any denomination of the right metal counts.',
  ],
  'big-denominations': [
    'Each slot reads the recorded denomination as a whole word — e.g. "Sestertius" matches "Æ Sestertius".',
    'The issuing ruler is irrelevant; a slot fills when a coin of that denomination exists in the cabinet.',
  ],
  'moneyers-republic': [
    'Slots read the coin’s moneyer — the "Issuer:" line on Republican labels.',
    'Names are matched as whole words; uncertain marks wait for your confirmation before counting.',
  ],
  'twelve-powers': [
    'Each slot reads the first clause of the reverse description — "Rev: Jupiter seated left…" counts as Jupiter.',
    'The obverse and the issuing claim are ignored here.',
  ],
  'mints-empire': [
    'Each slot reads the Mint: line of the label; a coin with no recorded mint fills no slot.',
    'Mints are matched as whole words — a mint recorded as "Londinium" never fills the Lugdunum slot.',
  ],
};

const QuestDetail = () => {
  const { questId } = useParams();
  const [quests, setQuests] = useState(null);
  const [coinsCount, setCoinsCount] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [openCoinId, setOpenCoinId] = useState(null);
  const [awardQuestId, setAwardQuestId] = useState(null);
  const prevCompleteRef = useRef({});
  const initializedRef = useRef(false);

  const refresh = useCallback(() => {
    axios.get(`${BASE_URL}/quests`)
      .then((res) => {
        const next = res.data;
        if (initializedRef.current) {
          const newly = next.filter((q) => q.progress.complete && !prevCompleteRef.current[q.id]);
          if (newly.length > 0) setAwardQuestId(newly[0].id);
        }
        next.forEach((q) => { prevCompleteRef.current[q.id] = q.progress.complete; });
        initializedRef.current = true;
        setQuests(next);
      })
      .catch(() => setError('Could not load quests. Try again.'));
  }, []);

  // "Pick the piece" — choose which qualifying coin counts for a slot.
  // The row keeps a quiet line; the candidates open in a picker modal.
  const [pickBusy, setPickBusy] = useState(false);
  const [pickTarget, setPickTarget] = useState(null);
  const handlePick = useCallback((coinId, questId, requirementId) => {
    setPickBusy(true);
    axios.post(`${BASE_URL}/quests/pick`, {
      coinId: coinId || null,
      questId,
      requirementId,
      remove: !coinId,
    })
      .then(() => { setPickTarget(null); refresh(); })
      .catch((err) => {
        console.error('quest pick failed', err?.response?.status, err?.response?.data?.error || err.message);
      })
      .finally(() => setPickBusy(false));
  }, [refresh]);

  useEffect(() => {
    axios.get(`${BASE_URL}/coins/collection`).catch(() => null)
      .then((c) => { if (c) setCoinsCount(Array.isArray(c.data) ? c.data.length : null); });
    refresh();
  }, [refresh]);

  if (error) {
    return (
      <div className="q-root">
        <div className="q-shell">
          <div className="q-container">
            <QuestError onRetry={() => { setError(null); refresh(); }} />
          </div>
        </div>
      </div>
    );
  }

  if (quests === null) {
    return <QuestLoading hint="Reading the quest…" />;
  }

  const quest = quests.find((q) => q.id === questId);
  if (!quest) {
    return (
      <div className="q-root q-detail-page">
        <div className="q-container">
          <Text c="dimmed" my="xl">No such quest.</Text>
          <Link className="q-back-link" to="/quests"><Icon name="arrow-left" size={18} />All quests</Link>
        </div>
      </div>
    );
  }

  const percent = percentOf(quest);
  const badge = badgeNameFor(quest);
  const counts = {
    collected: quest.requirements.filter((r) => r.status === 'collected').length,
    review: quest.requirements.filter((r) => r.status === 'review').length,
    needed: quest.requirements.filter((r) => r.status === 'needed').length,
  };
  const next = quest.requirements.find((r) => r.status !== 'collected');
  const visible = quest.requirements
    .map((req, index) => ({ req, index }))
    .filter(({ req }) => filter === 'all' || req.status === filter);

  const scrollToNext = () => {
    if (!next) return;
    const el = document.getElementById(`req-${next.name}`);
    if (!el) return;
    const parent = el.closest('details');
    if (parent) parent.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const detailEyebrow = [quest.family, quest.dates, `${quest.progress.total} ${quest.unit}`].filter(Boolean).join(' · ');


  // Rules rail copy — spoken per quest (Mark 2026-11-03): every quest
  // explains its own checkers. Mirrors the engine contract in
  // backend/quests/conceptData.js + questMatcher.js — update both together.
  const kinds = [...new Set(quest.requirements.map((r) => r.matchType))];
  const isTyped = kinds.every((k) => ['metal', 'denomination', 'reverseType', 'mint', 'moneyer'].includes(k));
  const questRules = RULES_BY_QUEST[quest.id]
    ?? (isTyped ? RULES_TYPED : RULES_RULER);

  return (
    <div className="q-root q-detail-page">
      <div className="q-shell">
      <div className="q-container">
        <Link className="q-back-link" to="/quests"><Icon name="arrow-left" size={18} />All quests</Link>

        <div className="q-detail-head">
          <div className="q-detail-copy">
            <p className="q-eyebrow">{detailEyebrow}</p>
            <h1 className="q-detail-title" tabIndex={-1}>{quest.title}</h1>
            <p className="q-lede">{quest.intro || quest.blurb}</p>
            <div className="q-meta-row">
              <span className="q-meta">{quest.progress.total} {quest.unit !== 'requirements' ? quest.unit : 'requirements'}</span>
              <span className="q-meta">{quest.dates}</span>
              <span className="q-meta">Badge · {badge}</span>
            </div>
            {quest.historicalNote && (
              <div className="q-note">
                <Icon name="info" size={16} />
                <p>{quest.historicalNote}</p>
              </div>
            )}
          </div>

          <aside className="q-progress-card" aria-label="Quest progress">
            <div className="q-progress-head">
              <p className="q-eyebrow">Quest progress</p>
              <Chip complete={quest.progress.complete}>{statusLabel(quest.progress.complete)}</Chip>
            </div>
            <div className="q-progress-visual">
              <ProgressRing percent={percent} collected={quest.progress.collected} total={quest.progress.total} />
              <div className="q-progress-copy">
                <strong>{quest.progress.collected} of {quest.progress.total}</strong>
                <span>requirements met</span>
                <span className="q-progress-remaining">{quest.progress.total - quest.progress.collected} remaining</span>
              </div>
            </div>
            <div className="q-badge-row">
              <Seal badge={quest.badge} earned={quest.progress.complete} size={80} />
              <div>
                <p className="q-badge-label">Badge</p>
                <p className="q-badge-name">{badge}</p>
                <p className="q-badge-state">
                  <Icon name={quest.progress.complete ? 'check' : 'lock'} size={13} />
                  {quest.progress.complete ? 'Earned' : 'Not yet earned'}
                </p>
              </div>
            </div>
            {quest.progress.complete
              ? <p className="q-progress-copy" style={{ marginTop: 20 }}><span style={{ color: '#d3f0d9' }}>All requirements secured — the badge is yours.</span></p>
              : next
                ? (
                  <button className="q-progress-btn" type="button" onClick={scrollToNext}>
                    <span>{next.status === 'review' ? 'Review' : 'Find'}: {next.name}</span>
                    <Icon name="arrow-right" size={16} />
                  </button>
                )
                : null}
          </aside>
        </div>

        {quest.progress.complete && (
          <button
            className="q-complete-banner q-complete-banner-btn"
            type="button"
            onClick={() => setAwardQuestId(quest.id)}
          >
            <Seal badge={quest.badge} earned size={52} />
            <div>
              <p className="q-eyebrow">Quest complete</p>
              <h2>{badge} badge earned</h2>
              <p>All {quest.progress.total} requirements are represented in your cabinet.</p>
            </div>
          </button>
        )}

        <div className="q-detail-body">
          <aside className="q-rules" aria-labelledby="rules-heading">
            <h2 id="rules-heading">How this quest is checked</h2>
            <ul className="q-rule-list">
              {questRules.map((rule) => (
                <li key={rule}>
                  <Icon name="check" size={16} />
                  <span>{rule}</span>
                </li>
              ))}
              <li>
                <Icon name="check" size={16} />
                <span>One coin can satisfy one requirement in this quest. The same coin may count in another quest.</span>
              </li>
              <li>
                <Icon name="alert" size={16} />
                <span>An uncertain attribution is a possible match. It never counts until you confirm it.</span>
              </li>
            </ul>
            <p className="q-rules-note">
              Only the slot's identity is checked. Year and denomination are shown for context.
              Mint, deity, legend text, and reverse type beyond the slot value are not evaluated.
            </p>
            {coinsCount !== null && (
              <div className="q-cabinet-line">
                <Icon name="info" size={16} />
                <span>{coinsCount} coins in your cabinet</span>
              </div>
            )}
          </aside>

          <section className="q-req-card" aria-labelledby="requirements-heading">
            <div className="q-req-head">
              <div className="q-req-head-row">
                <h2 id="requirements-heading" tabIndex={-1}>Requirements</h2>
                <span className="q-req-count">{quest.progress.collected} of {quest.progress.total} collected</span>
              </div>
              <div className="q-filter-row q-req-filters" role="group" aria-label="Filter requirements by status">
                {reqFilterButton('all', 'All', quest.progress.total, filter, setFilter)}
                {reqFilterButton('collected', 'Collected', counts.collected, filter, setFilter)}
                {reqFilterButton('review', 'Needs review', counts.review, filter, setFilter)}
                {reqFilterButton('needed', 'Still needed', counts.needed, filter, setFilter)}
              </div>
            </div>

            <div className="q-req-list">
              {quest.sections && quest.sections.length > 0 ? (
                quest.sections.map((section) => {
                  const all = visible.filter(({ req }) => req.section === section.id);
                  if (all.length === 0) return null;
                  const sectionAll = quest.requirements.filter((r) => r.section === section.id);
                  const sectionDone = sectionAll.filter((r) => r.status === 'collected').length;
                  const sectionActive = sectionAll.some((r) => r.status !== 'needed');
                  const shouldOpen = filter !== 'all' || sectionActive;
                  return (
                    <details key={section.id} className="q-req-section" open={shouldOpen}>
                      <summary>
                        <span className="q-req-section-title">
                          <h3>{section.title}</h3>
                          <span className="q-req-section-range">{section.range}</span>
                        </span>
                        <span className="q-req-section-meta">
                          <span>{sectionDone} of {sectionAll.length}</span>
                          <Icon name="chevron-right" size={16} />
                        </span>
                      </summary>
                      <div className="q-req-section-rows">
                        {all.map(({ req, index }) => <ReqRow key={req.name} req={req} questId={quest.id} index={index} total={quest.progress.total} onOpenCoin={setOpenCoinId} onOpenPick={(questId, req) => setPickTarget({ questId, req })} onClearPick={handlePick} pickBusy={pickBusy} />)}
                      </div>
                    </details>
                  );
                })
              ) : (
                visible.length === 0 ? (
                  <div className="q-req-empty" role="status">
                    {filter === 'review' && (
                      <>
                        <h3>No attributions need review</h3>
                        <p>Every conflicting match in this quest has been resolved. Collected coins remain listed under All.</p>
                        <button className="q-filter-btn" type="button" aria-pressed="false" onClick={() => setFilter('all')}>Show all requirements</button>
                      </>
                    )}
                    {filter === 'needed' && (
                      <>
                        <h3>{quest.progress.complete ? 'Nothing is missing' : 'No ruler is missing outright'}</h3>
                        {quest.progress.complete
                          ? <p>Every ruler is represented in your cabinet, and the badge is earned.</p>
                          : <p>{counts.review} {counts.review === 1 ? 'requirement still needs' : 'requirements still need'} an attribution review. Confirm a match to clear it.</p>}
                        <button className="q-filter-btn" type="button" aria-pressed="false" onClick={() => setFilter(quest.progress.complete ? 'all' : 'review')}>
                          {quest.progress.complete ? 'Show all requirements' : 'Review possible matches'}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  visible.map(({ req, index }) => <ReqRow key={req.name} req={req} questId={quest.id} index={index} total={quest.progress.total} onOpenCoin={setOpenCoinId} onOpenPick={(questId, req) => setPickTarget({ questId, req })} onClearPick={handlePick} pickBusy={pickBusy} />)
                )
              )}
            </div>
          </section>
        </div>
      </div>
      </div>
      <PickDialog
        pickTarget={pickTarget}
        onClose={() => setPickTarget(null)}
        onPick={handlePick}
        onClearPick={handlePick}
        busy={pickBusy}
      />
      <CoinDialog coinId={openCoinId} onClose={() => setOpenCoinId(null)} onChanged={refresh} />
      <AwardDialog quest={quests.find((q) => q.id === awardQuestId)} quests={quests} open={!!awardQuestId} onClose={() => setAwardQuestId(null)} />
    </div>
  );
};

export default QuestDetail;
