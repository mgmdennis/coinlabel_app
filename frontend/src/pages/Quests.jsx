import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Text } from '@mantine/core';

import { BASE_URL } from '../config';
import '../quests.css';
import { QuestLoading } from '../quests-ui-loading';
import {
  Bar, Chip, Icon, Seal, badgeNameFor, statusLabel,
} from '../quests-ui';

// Roman Imperial Quests — the quest library overview. Progress is computed
// live by the backend on every load. Concept flows: status filters, era/theme
// family chips, live search over the library, a badge deck of earned seals,
// and an empty state with a reset.

const FAMILIES_EXPECTED = 3;

const percentOf = (q) =>
  q.progress.total ? Math.round((q.progress.collected / q.progress.total) * 100) : 0;

const nextOf = (q) => {
  const open = q.requirements.find((r) => r.status !== 'collected');
  return open ? { name: open.name, status: open.status } : null;
};

const statusOfQuest = (q) => {
  if (q.progress.complete) return { label: 'Completed', cls: 'q-chip-complete', icon: 'check' };
  if (q.progress.collected === 0) return { label: 'Not started', cls: 'q-chip-missing', icon: 'lock' };
  return { label: 'In progress', cls: 'q-chip-progress', icon: 'circle' };
};

const QuestCard = ({ quest }) => {
  const percent = percentOf(quest);
  const next = nextOf(quest);
  const status = statusOfQuest(quest);
  const eyebrow = [quest.family, quest.dates, `${quest.requirements.length} ${quest.unit}`]
    .filter(Boolean).join(' · ');
  return (
    <Link
      className={`q-card${quest.progress.complete ? ' q-card-complete' : ''}`}
      to={`/quests/${quest.id}`}
      data-family={quest.family}
    >
      <div className="q-card-top">
        <div className="q-card-badge">
          <Seal badge={quest.badge} earned={quest.progress.complete} />
          <div>
            <p className="q-badge-name">{badgeNameFor(quest)}</p>
            <p className="q-badge-state">
              <Icon name={quest.progress.complete ? 'check' : 'lock'} size={13} />
              {quest.progress.complete ? 'Earned' : 'Not yet earned'}
            </p>
          </div>
        </div>
        <span className={`q-chip ${status.cls}`}>
          <Icon name={status.icon} size={13} />
          {status.label}
        </span>
      </div>
      <div className="q-card-body">
        <p className="q-card-eyebrow">{eyebrow}</p>
        <h2 className="q-card-title">{quest.title}</h2>
        <p className="q-card-desc">{quest.blurb}</p>
      </div>
      <div className="q-card-progress">
        <div className="q-progress-label">
          <span>{quest.progress.collected} of {quest.progress.total} {quest.unit}</span>
          <span className="q-progress-pct">{percent}%</span>
        </div>
        <Bar
          percent={percent}
          collected={quest.progress.collected}
          total={quest.progress.total}
          complete={quest.progress.complete}
        />
        <p className="q-next-line">
          {quest.progress.complete
            ? <><Icon name="circle-check" size={15} /><span>All {quest.progress.total} slots secured.</span></>
            : next
              ? <><Icon name={next.status === 'review' ? 'alert' : 'circle'} size={15} /><span>Next: {next.name} {next.status === 'review' ? 'needs review' : 'still needed'}.</span></>
              : null}
        </p>
      </div>
      <div className="q-card-foot">
        <span>{quest.progress.complete ? 'Revisit quest' : 'Open quest'}</span>
        <Icon name="arrow-right" size={17} />
      </div>
    </Link>
  );
};

const BadgeDeck = ({ quests }) => {
  const earned = quests.filter((q) => q.progress.complete);
  if (earned.length === 0) return null;
  return (
    <div className="q-badge-deck-block">
      <div className="q-badge-deck-head">
        <span><strong>{earned.length}</strong> badges earned</span>
      </div>
      <div className="q-badge-deck" tabIndex={0}>
        <div className="q-badge-deck-track">
          {earned.map((q, i) => (
            <Link
              key={q.id}
              className="q-badge-deck-item"
              to={`/quests/${q.id}`}
              title={`${badgeNameFor(q)} badge earned`}
              aria-label={`${badgeNameFor(q)} badge earned`}
              style={{ '--deck-rot': `${(i % 3) - 1}deg`, '--deck-y': `${[0, -2, 2][i % 3]}px` }}
            >
              <Seal badge={q.badge} earned size={68} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const Quests = () => {
  const [quests, setQuests] = useState(null);
  const [coinsCount, setCoinsCount] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [family, setFamily] = useState('all');
  const [query, setQuery] = useState('');

  const refresh = useCallback(() => {
    Promise.all([
      axios.get(`${BASE_URL}/quests`),
      axios.get(`${BASE_URL}/coins/collection`).catch(() => null),
    ])
      .then(([qq, c]) => {
        setQuests(qq.data);
        if (c) setCoinsCount(Array.isArray(c.data) ? c.data.length : null);
      })
      .catch(() => setError('Could not load quests. Try again.'));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const families = useMemo(() => {
    if (!quests) return [];
    const seen = [];
    for (const q of quests) {
      if (q.family && !seen.includes(q.family)) seen.push(q.family);
    }
    return seen;
  }, [quests]);

  const summary = useMemo(() => {
    if (!quests) return null;
    const requirementsMet = quests.reduce((s, q) => s + q.progress.collected, 0);
    const requirementsTotal = quests.reduce((s, q) => s + q.progress.total, 0);
    const questsComplete = quests.filter((q) => q.progress.complete).length;
    return {
      requirementsMet,
      requirementsTotal,
      questsComplete,
      badgesEarned: questsComplete,
      percent: requirementsTotal ? Math.round((requirementsMet / requirementsTotal) * 100) : 0,
    };
  }, [quests]);

  const completed = quests?.filter((q) => q.progress.complete) ?? [];
  const active = quests?.filter((q) => !q.progress.complete) ?? [];

  const searchText = (q) => [
    q.title, q.summary, q.family, q.badge?.name, q.dates,
    ...q.requirements.map((r) => `${r.name} ${r.reign ?? ''}`),
  ].join(' ').toLowerCase();

  const filtered = (quests ?? []).filter((q) => {
    if (filter === 'completed' && !q.progress.complete) return false;
    if (filter === 'active' && q.progress.complete) return false;
    if (family !== 'all' && q.family !== family) return false;
    if (query.trim()) {
      const hay = searchText(q);
      for (const word of query.trim().toLowerCase().split(/\s+/)) {
        if (word && !hay.includes(word)) return false;
      }
    }
    return true;
  });

  if (error) {
    return <div className="q-root"><div className="q-container"><Text c="red.7">{error}</Text></div></div>;
  }

  if (quests === null || summary === null) {
    return <QuestLoading hint="Preparing the library…" />;
  }

  return (
    <div className="q-root">
      <div className="q-shell">
      <header className="q-page-head q-container">
        <div className="q-page-intro">
          <p className="q-eyebrow">The cabinet · Quests</p>
          <h1 className="q-page-title" tabIndex={-1}>Roman Imperial Quests</h1>
          <p className="q-lede">
            {quests.length} curated sets, checked directly against the coins in your
            cabinet. Search the library by ruler, dynasty, or collecting theme, then
            see exactly what counts and what is still missing.
          </p>
        </div>
        <aside className="q-summary" aria-label="Cabinet progress">
          <div className="q-summary-top">
            <p className="q-eyebrow">Cabinet progress</p>
            <Chip complete={summary.questsComplete > 0}>
              {summary.questsComplete} of {quests.length} complete
            </Chip>
          </div>
          <div className="q-summary-figure">
            <strong>{summary.requirementsMet}</strong>
            <span>of {summary.requirementsTotal} requirements met</span>
          </div>
          <Bar
            percent={summary.percent}
            collected={summary.requirementsMet}
            total={summary.requirementsTotal}
            large
            complete={summary.percent === 100}
          />
          <div className="q-summary-meta">
            {summary.badgesEarned === 0 && (
              <span><strong>0</strong> badges earned — complete a quest for your first</span>
            )}
            {coinsCount !== null && (
              <span><strong>{coinsCount}</strong> {coinsCount === 1 ? 'coin' : 'coins'} in cabinet</span>
            )}
          </div>
          <BadgeDeck quests={quests} />
        </aside>
      </header>

      <section className="q-container q-section" aria-labelledby="quests-heading">
        <div className="q-section-head">
          <h2 className="q-section-title" id="quests-heading">Quest library</h2>
          <div className="q-filter-row" role="group" aria-label="Filter quests by status">
            <button className="q-filter-btn" type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All<span className="q-filter-count">{quests.length}</span></button>
            <button className="q-filter-btn" type="button" aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>In progress<span className="q-filter-count">{active.length}</span></button>
            <button className="q-filter-btn" type="button" aria-pressed={filter === 'completed'} onClick={() => setFilter('completed')}>Completed<span className="q-filter-count">{completed.length}</span></button>
          </div>
        </div>

        <div className="q-library-toolbar">
          <div className="q-search-field">
            <Icon name="info" size={18} />
            <label className="q-visually-hidden" htmlFor="quest-search">Search quests</label>
            <input
              className="q-search-input"
              id="quest-search"
              type="search"
              placeholder="Search ruler, dynasty, or theme"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="q-family-row" role="group" aria-label="Filter quests by era or theme">
            <button
              className="q-filter-btn"
              type="button"
              aria-pressed={family === 'all'}
              onClick={() => setFamily('all')}
            >
              All eras<span className="q-filter-count">{quests.length}</span>
            </button>
            {families.map((f) => (
              <button
                key={f}
                className="q-filter-btn"
                type="button"
                aria-pressed={family === f}
                onClick={() => setFamily(f)}
              >
                {f}<span className="q-filter-count">{quests.filter((q) => q.family === f).length}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="q-library-count" role="status">
          Showing {filtered.length} of {quests.length} quests
        </p>

        {filtered.length === 0 && (
          <div className="q-library-empty" role="status">
            <h3>No quests match this view</h3>
            <p>Try a different search or clear the era and status filters to see the whole library.</p>
            <button
              className="q-filter-btn"
              type="button"
              onClick={() => { setFilter('all'); setFamily('all'); setQuery(''); }}
            >
              Reset filters
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="q-grid">
            {filtered.map((q) => <QuestCard key={q.id} quest={q} />)}
          </div>
        )}
      </section>
      </div>
    </div>
  );
};

export default Quests;
