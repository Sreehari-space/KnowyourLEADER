# Know Your Leader — Mobile Redesign Implementation Guide

> **Stack**: Vite + React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide React  
> **Scope**: Mobile only (≤ 480px). All changes wrapped in `@media (max-width: 480px)` or `sm:` Tailwind breakpoints.  
> **Hero characters**: UNTOUCHED. Only CTA strip added below headline.  
> **Files touched**: `src/pages/Home.tsx`, `src/index.css`, `src/components/CandidateCard.tsx`, `src/components/ConstituencyMap.tsx`

---

## 0. Existing Stack Audit

| Asset | Current | Problem |
|-------|---------|---------|
| Fonts | Inter + Space Grotesk + JetBrains Mono + Playfair Display + Lilita One | Inter/Space Grotesk = generic. Keep Playfair + JetBrains Mono. Add **Faustina** for mobile headers. |
| Colors | `#FCFBF9` bg, `neutral-800` text, `indigo-600` accent | Indigo accent weak for civic trust. Swap to `#C8A84B` (gold) on mobile only. |
| Animation | `motion` library installed, underused | Use `motion` for card tap expansion + sheet slide-up |
| Candidate sort | Top 20 by `netWorth` desc | Label misleading. Rename section. |
| Search | Routes to `/affidavits` page | Fine. Keep behavior. Fix placeholder text only. |

---

## 1. `index.css` — Mobile Token Layer

Add this block **after** existing `@theme {}`. Does not override desktop.

```css
/* ========================================
   MOBILE REDESIGN TOKENS (≤480px only)
   ======================================== */
@media (max-width: 480px) {
  :root {
    --m-gutter: 16px;
    --m-radius-card: 12px;
    --m-radius-pill: 100px;
    --m-accent: #C8A84B;
    --m-accent-dim: rgba(200, 168, 75, 0.15);
    --m-surface: #F5F3EF;
    --m-surface-raised: #ECEAE5;
    --m-border: #D8D4CC;
    --m-won: #1A7A4A;
    --m-won-bg: rgba(26, 122, 74, 0.08);
    --m-lost: #9A9590;
    --m-lost-bg: rgba(154, 149, 144, 0.08);
    --m-text-primary: #1A1816;
    --m-text-secondary: #6B6762;
  }
}

/* ========================================
   MOBILE: Stats bar scroll
   ======================================== */
@media (max-width: 480px) {
  .m-stats-scroll {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    gap: 0;
    border-top: 1px solid var(--m-border);
    border-bottom: 1px solid var(--m-border);
  }
  .m-stats-scroll::-webkit-scrollbar { display: none; }

  .m-stat-chip {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 20px;
    border-right: 1px solid var(--m-border);
    gap: 2px;
  }
  .m-stat-chip:last-child { border-right: none; }

  .m-stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--m-accent);
    line-height: 1;
  }
  .m-stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    color: var(--m-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
}

/* ========================================
   MOBILE: Map instruction banner
   ======================================== */
@media (max-width: 480px) {
  .m-map-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--m-surface-raised);
    border: 1px solid var(--m-border);
    border-radius: var(--m-radius-card);
    padding: 10px 14px;
    margin: 0 var(--m-gutter) 10px;
    font-size: 13px;
    color: var(--m-text-secondary);
  }

  .m-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m-accent);
    flex-shrink: 0;
    animation: mPulse 1.8s ease-in-out infinite;
  }

  @keyframes mPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(0.65); }
  }
}

/* ========================================
   MOBILE: Party legend scroll
   ======================================== */
@media (max-width: 480px) {
  .m-party-legend {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 10px var(--m-gutter);
    border-bottom: 1px solid var(--m-border);
  }
  .m-party-legend::-webkit-scrollbar { display: none; }

  .m-party-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px 5px 8px;
    background: var(--m-surface-raised);
    border: 1px solid var(--m-border);
    border-radius: var(--m-radius-pill);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .m-party-swatch {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .m-party-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--m-text-primary);
  }

  .m-party-seats {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--m-accent);
  }
}

/* ========================================
   MOBILE: Constituency bottom sheet
   ======================================== */
@media (max-width: 480px) {
  .m-bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FAFAF8;
    border-top: 1px solid var(--m-border);
    border-radius: 20px 20px 0 0;
    padding: 0 var(--m-gutter) env(safe-area-inset-bottom, 20px);
    transform: translateY(100%);
    transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
    z-index: 200;
    box-shadow: 0 -8px 32px rgba(0,0,0,0.08);
  }
  .m-bottom-sheet.open {
    transform: translateY(0);
  }
  .m-sheet-handle {
    width: 36px;
    height: 4px;
    background: var(--m-border);
    border-radius: 2px;
    margin: 12px auto 16px;
  }
  .m-sheet-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--m-text-secondary);
    display: block;
    margin-bottom: 4px;
  }
  .m-sheet-winner {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--m-text-primary);
    display: block;
    margin-bottom: 2px;
  }
  .m-sheet-party {
    font-size: 13px;
    font-weight: 600;
    display: block;
    margin-bottom: 16px;
  }
  .m-sheet-cta {
    width: 100%;
    padding: 13px;
    background: var(--m-text-primary);
    color: #FAFAF8;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 700;
    border-radius: var(--m-radius-card);
    border: none;
    margin-bottom: 12px;
    cursor: pointer;
  }
  .m-sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 199;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s ease;
  }
  .m-sheet-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }
}

/* ========================================
   MOBILE: Candidate card list
   ======================================== */
@media (max-width: 480px) {
  /* Override grid to single column list */
  #affidavit-list-module .grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 1px !important;
    background: var(--m-border) !important;
    border-radius: 0 !important;
    margin: 0 calc(-1 * var(--m-gutter)) !important;
  }

  /* Card base reset for mobile list style */
  .m-candidate-card-mobile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px var(--m-gutter);
    background: #FAFAF8;
    cursor: pointer;
    flex-wrap: wrap;
    transition: background 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .m-candidate-card-mobile:active {
    background: var(--m-surface);
  }

  /* Avatar */
  .m-card-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    position: relative;
  }
  .m-card-avatar-placeholder {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .m-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .m-won-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #FAFAF8;
  }
  .m-won-dot.won { background: var(--m-won); }
  .m-won-dot.lost { background: var(--m-lost); }

  /* Info block */
  .m-card-info { flex: 1; min-width: 0; }
  .m-card-name {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--m-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .m-card-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .m-card-party {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .m-card-sep { color: var(--m-border); font-size: 11px; }
  .m-card-constituency {
    font-size: 11px;
    color: var(--m-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Status badge */
  .m-card-status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    padding: 3px 7px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .m-card-status.won {
    background: var(--m-won-bg);
    color: var(--m-won);
    border: 1px solid rgba(26,122,74,0.2);
  }
  .m-card-status.lost {
    background: var(--m-lost-bg);
    color: var(--m-lost);
    border: 1px solid var(--m-border);
  }

  /* Expanded detail row */
  .m-card-expanded {
    width: 100%;
    display: flex;
    align-items: stretch;
    border-top: 1px solid var(--m-border);
    margin-top: 10px;
    padding-top: 12px;
  }
  .m-card-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 10px;
    border-right: 1px solid var(--m-border);
  }
  .m-card-stat:first-child { padding-left: 0; }
  .m-cstat-label {
    font-size: 9px;
    color: var(--m-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .m-cstat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--m-text-primary);
  }
  .m-card-view-btn {
    flex-shrink: 0;
    padding: 0 12px;
    background: var(--m-text-primary);
    color: #FAFAF8;
    font-size: 12px;
    font-weight: 700;
    border-radius: 8px;
    border: none;
    margin-left: 8px;
    cursor: pointer;
    white-space: nowrap;
  }
}

/* ========================================
   MOBILE: Section header
   ======================================== */
@media (max-width: 480px) {
  .m-section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 20px var(--m-gutter) 10px;
  }
  .m-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--m-text-primary);
    line-height: 1.15;
  }
  .m-section-sub {
    font-size: 11px;
    color: var(--m-text-secondary);
    margin-top: 2px;
    display: block;
  }
  .m-view-all-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--m-accent);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}

/* ========================================
   MOBILE: Party filter chips
   ======================================== */
@media (max-width: 480px) {
  .m-filter-chips {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 0 var(--m-gutter) 12px;
  }
  .m-filter-chips::-webkit-scrollbar { display: none; }
  .m-filter-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: var(--m-radius-pill);
    border: 1px solid var(--m-border);
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    color: var(--m-text-secondary);
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }
  .m-filter-chip.active {
    background: var(--m-text-primary);
    border-color: var(--m-text-primary);
    color: #FAFAF8;
  }
}

/* ========================================
   MOBILE: Sticky search bar
   ======================================== */
@media (max-width: 480px) {
  .m-sticky-search {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(252, 251, 249, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 8px var(--m-gutter);
    border-bottom: 1px solid var(--m-border);
    transform: translateY(-110%);
    transition: transform 0.22s ease;
  }
  .m-sticky-search.visible {
    transform: translateY(0);
  }
  .m-sticky-search-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--m-surface-raised);
    border: 1px solid var(--m-border);
    border-radius: var(--m-radius-pill);
    padding: 9px 14px;
  }
  .m-sticky-search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 14px;
    color: var(--m-text-primary);
  }
  .m-sticky-search-input::placeholder {
    color: var(--m-text-secondary);
  }
}

/* ========================================
   MOBILE: Directory CTA block
   ======================================== */
@media (max-width: 480px) {
  .m-directory-cta {
    margin: 24px var(--m-gutter) 32px;
    background: var(--m-surface-raised);
    border: 1px solid var(--m-border);
    border-radius: var(--m-radius-card);
    padding: 22px 18px;
    text-align: center;
  }
  .m-dir-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--m-accent);
    display: block;
    margin-bottom: 6px;
  }
  .m-dir-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--m-text-primary);
    margin-bottom: 6px;
  }
  .m-dir-sub {
    font-size: 12px;
    color: var(--m-text-secondary);
    margin-bottom: 18px;
    line-height: 1.5;
  }
  .m-dir-btn {
    width: 100%;
    padding: 13px;
    background: var(--m-text-primary);
    color: #FAFAF8;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 700;
    border-radius: var(--m-radius-card);
    border: none;
    cursor: pointer;
  }
}

/* ========================================
   MOBILE: Footer
   ======================================== */
@media (max-width: 480px) {
  .m-footer-override {
    padding: 28px var(--m-gutter) calc(env(safe-area-inset-bottom, 0px) + 32px) !important;
    text-align: center !important;
  }
  .m-footer-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 16px;
  }
  .m-footer-links a {
    font-size: 13px;
    color: var(--m-text-secondary);
    text-decoration: none;
  }
  .m-footer-legal {
    font-size: 10px;
    color: var(--m-text-secondary);
    opacity: 0.55;
    line-height: 1.6;
  }
}

/* ========================================
   MOBILE: Skeleton loading
   ======================================== */
@media (max-width: 480px) {
  @keyframes mShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .m-skel {
    background: linear-gradient(
      90deg,
      var(--m-surface) 25%,
      var(--m-surface-raised) 50%,
      var(--m-surface) 75%
    );
    background-size: 200% 100%;
    animation: mShimmer 1.4s ease infinite;
    border-radius: 6px;
  }
  .m-skel-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
  }
  .m-skel-name { width: 55%; height: 13px; margin-bottom: 6px; }
  .m-skel-meta { width: 38%; height: 10px; }
  .m-skel-badge { width: 34px; height: 22px; border-radius: 4px; }
}
```

---

## 2. `src/pages/Home.tsx` — Changes

### 2a. Add state + scroll hook (top of component)

Add these inside `Home()` after existing state declarations:

```tsx
// Mobile: sticky search visibility
const [stickyVisible, setStickyVisible] = useState(false);

// Mobile: constituency sheet
const [sheetCandidate, setSheetCandidate] = useState<Candidate | null>(null);

// Mobile: expanded card id
const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

// Mobile: active party filter chip
const [mobilePartyFilter, setMobilePartyFilter] = useState<string>('ALL');

// Scroll listener for sticky search
useEffect(() => {
  const onScroll = () => {
    const hero = document.querySelector('.hero-section-wrapper');
    if (!hero) return;
    const { bottom } = hero.getBoundingClientRect();
    setStickyVisible(bottom < 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

### 2b. Mobile party data (add below existing `topCandidates` calculation)

```tsx
// Mobile party filter data — derived from candidates
const partyStats = React.useMemo(() => {
  const map: Record<string, { seats: number; color: string }> = {};
  candidates.forEach(c => {
    if (!c.elected) return;
    if (!map[c.party]) map[c.party] = { seats: 0, color: c.partyColor || '#888' };
    map[c.party].seats++;
  });
  return Object.entries(map)
    .sort((a, b) => b[1].seats - a[1].seats)
    .slice(0, 7)
    .map(([code, val]) => ({ code, ...val }));
}, [candidates]);

// Mobile filtered top candidates
const mobileTopCandidates = React.useMemo(() => {
  let list = topCandidates;
  if (mobilePartyFilter !== 'ALL') {
    list = candidates
      .filter(c => c.party === mobilePartyFilter)
      .sort((a, b) => b.netWorth - a.netWorth)
      .slice(0, 20);
  }
  return list;
}, [topCandidates, candidates, mobilePartyFilter]);
```

### 2c. Replace Stats Ticker JSX (mobile only wrapper)

Find the existing stats ticker `<div className="max-w-3xl mx-auto mt-6 sm:mt-10">` and wrap it:

```tsx
{/* Stats Ticker — desktop (sm and up) */}
<div className="hidden sm:block max-w-3xl mx-auto mt-6 sm:mt-10">
  {/* ...existing ticker JSX unchanged... */}
</div>

{/* Stats Bar — mobile only */}
<div className="m-stats-scroll sm:hidden mt-4">
  <div className="m-stat-chip">
    <span className="m-stat-value">4023</span>
    <span className="m-stat-label">{lang === 'en' ? 'Candidates' : 'வேட்பாளர்'}</span>
  </div>
  <div className="m-stat-chip">
    <span className="m-stat-value">234</span>
    <span className="m-stat-label">{lang === 'en' ? 'Constituencies' : 'தொகுதிகள்'}</span>
  </div>
  <div className="m-stat-chip">
    <span className="m-stat-value">{totalCases.toLocaleString()}</span>
    <span className="m-stat-label">{lang === 'en' ? 'Cases Filed' : 'வழக்குகள்'}</span>
  </div>
  <div className="m-stat-chip">
    <span className="m-stat-value">{cleanCount}</span>
    <span className="m-stat-label">{lang === 'en' ? 'Clean Record' : 'தூய பதிவு'}</span>
  </div>
</div>
```

### 2d. Sticky Search Bar (add right before `<header>` opening tag)

```tsx
{/* Mobile sticky search — appears after hero scrolls out */}
<div className={`m-sticky-search sm:hidden ${stickyVisible ? 'visible' : ''}`}>
  <form onSubmit={handleSearchSubmit} className="m-sticky-search-inner">
    <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
    <input
      className="m-sticky-search-input"
      placeholder={lang === 'en' ? 'Search candidate or constituency…' : 'பெயர் அல்லது தொகுதி தேடவும்…'}
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
    />
    {searchQuery && (
      <button type="button" onClick={() => setSearchQuery('')}>
        <X className="w-3.5 h-3.5 text-neutral-400" />
      </button>
    )}
  </form>
</div>
```

### 2e. Map Section — Add mobile instruction banner + party legend

In `Home.tsx`, find `<ConstituencyMap ... />` and wrap it:

```tsx
{/* Mobile: map instruction banner */}
<div className="m-map-banner sm:hidden">
  <span className="m-pulse-dot" />
  <span className="font-sans text-sm">
    {lang === 'en' ? 'Tap any constituency to explore' : 'எந்த தொகுதியையும் தட்டி ஆராயுங்கள்'}
  </span>
</div>

<ConstituencyMap
  lang={lang}
  candidates={candidates}
  onConstituencyClick={handleConstituencyClick}
  onSelectCandidate={(c) => {
    // Mobile: show bottom sheet instead of modal
    if (window.innerWidth <= 480) {
      setSheetCandidate(c);
    } else {
      setActiveDetailedCandidate(c);
    }
  }}
/>

{/* Mobile: party legend scroll */}
<div className="m-party-legend sm:hidden">
  {partyStats.map(p => (
    <div key={p.code} className="m-party-chip">
      <span className="m-party-swatch" style={{ background: p.color }} />
      <span className="m-party-code">{p.code}</span>
      <span className="m-party-seats">{p.seats}</span>
    </div>
  ))}
</div>

{/* Mobile: constituency bottom sheet */}
<div
  className={`m-bottom-sheet sm:hidden ${sheetCandidate ? 'open' : ''}`}
  role="dialog"
  aria-modal="true"
>
  <div className="m-sheet-handle" />
  {sheetCandidate && (
    <>
      <span className="m-sheet-eyebrow">{sheetCandidate.constituency}</span>
      <span className="m-sheet-winner">{sheetCandidate.name}</span>
      <span
        className="m-sheet-party"
        style={{ color: sheetCandidate.partyColor }}
      >
        {sheetCandidate.party}
      </span>
      <button
        className="m-sheet-cta"
        onClick={() => {
          setActiveDetailedCandidate(sheetCandidate);
          setSheetCandidate(null);
        }}
      >
        {lang === 'en' ? 'View Full Profile →' : 'முழு விவரம் காண்க →'}
      </button>
    </>
  )}
</div>
<div
  className={`m-sheet-overlay sm:hidden ${sheetCandidate ? 'open' : ''}`}
  onClick={() => setSheetCandidate(null)}
/>
```

### 2f. Candidate list section — full mobile replacement

Find the `{/* Results count */}` div and replace the **entire block** from there through the closing `</main>` with:

```tsx
{/* Results count — desktop */}
<div className="hidden sm:flex items-center justify-between max-w-4xl mx-auto px-1">
  <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-900 tracking-tight">
    {lang === 'en' ? 'Top 20 Declared Candidates' : 'முதல் 20 அறிவிக்கப்பட்ட வேட்பாளர்கள்'}
  </h3>
  <button
    onClick={() => navigate('/affidavits')}
    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
  >
    {lang === 'en' ? 'View All Affidavits' : 'அனைத்தையும் பார்க்கவும்'}
  </button>
</div>

{/* Mobile section header */}
<div className="m-section-header sm:hidden">
  <div>
    <span className="m-section-title">
      {lang === 'en' ? '2026 Winners' : '2026 வெற்றியாளர்கள்'}
    </span>
    <span className="m-section-sub">
      {lang === 'en' ? 'Tap card for affidavit details' : 'அலுவல் விவரம் காண தட்டவும்'}
    </span>
  </div>
  <button className="m-view-all-btn" onClick={() => navigate('/affidavits')}>
    {lang === 'en' ? 'See All →' : 'அனைத்தும் →'}
  </button>
</div>

{/* Mobile party filter chips */}
<div className="m-filter-chips sm:hidden">
  <button
    className={`m-filter-chip ${mobilePartyFilter === 'ALL' ? 'active' : ''}`}
    onClick={() => setMobilePartyFilter('ALL')}
  >
    {lang === 'en' ? 'All' : 'அனைத்தும்'}
  </button>
  {partyStats.map(p => (
    <button
      key={p.code}
      className={`m-filter-chip ${mobilePartyFilter === p.code ? 'active' : ''}`}
      onClick={() => setMobilePartyFilter(p.code)}
    >
      <span
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: p.color, display: 'inline-block', flexShrink: 0
        }}
      />
      {p.code}
    </button>
  ))}
</div>

{/* Desktop candidate grid — unchanged */}
<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {topCandidates.map((cand) => (
    <CandidateCard
      key={cand.id}
      candidate={cand}
      lang={lang}
      fontSize={fontSize}
      onOpenDetails={(c) => setActiveDetailedCandidate(c)}
      onAddToCompare={handleAddCandidateToCompare}
      isComparing={false}
    />
  ))}
</div>

{/* Mobile candidate list */}
<div className="sm:hidden">
  {mobileTopCandidates.map((cand) => (
    <MobileCandidateRow
      key={cand.id}
      candidate={cand}
      lang={lang}
      expanded={expandedCardId === cand.id}
      onToggle={() => setExpandedCardId(
        expandedCardId === cand.id ? null : cand.id
      )}
      onViewProfile={() => setActiveDetailedCandidate(cand)}
    />
  ))}
</div>

{/* Directory CTA — desktop */}
<div className="hidden sm:block text-center pt-8">
  <button
    onClick={() => navigate('/affidavits')}
    className="px-8 py-4 bg-white border border-neutral-200 hover:border-indigo-200 text-neutral-800 hover:text-indigo-600 font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center space-x-2"
  >
    <span>{lang === 'en' ? 'Explore Full Directory' : 'முழு பட்டியலையும் ஆராயுங்கள்'}</span>
  </button>
</div>

{/* Directory CTA — mobile */}
<div className="m-directory-cta sm:hidden">
  <span className="m-dir-eyebrow">
    {lang === 'en' ? 'All 234 constituencies' : '234 தொகுதிகள்'}
  </span>
  <p className="m-dir-title">
    {lang === 'en' ? 'Explore Full Directory' : 'முழு பட்டியல்'}
  </p>
  <p className="m-dir-sub">
    {lang === 'en'
      ? 'Assets · Criminal cases · Education · Past terms'
      : 'சொத்துக்கள் · வழக்குகள் · கல்வி · கடந்த பதவிகள்'}
  </p>
  <button className="m-dir-btn" onClick={() => navigate('/affidavits')}>
    {lang === 'en' ? 'Open Directory →' : 'பட்டியல் திறக்கவும் →'}
  </button>
</div>
```

---

## 3. New Component: `MobileCandidateRow`

Create `src/components/MobileCandidateRow.tsx`:

```tsx
/**
 * Mobile-only candidate row component.
 * Collapsed: avatar + name + party + constituency + won/lost badge
 * Expanded: + margin, assets, cases + view profile CTA
 */
import React from 'react';
import { Candidate, LanguageSetting } from '../types';
import { FORMAT_CURRENCY } from '../data/candidates';

interface Props {
  candidate: Candidate;
  lang: LanguageSetting;
  expanded: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
}

export default function MobileCandidateRow({
  candidate: c,
  lang,
  expanded,
  onToggle,
  onViewProfile,
}: Props) {
  const won = c.elected === true;
  const initial = c.name.charAt(0).toUpperCase();

  // Party-colored background for placeholder
  const placeholderStyle = {
    background: c.partyColor
      ? `color-mix(in srgb, ${c.partyColor} 18%, #F5F3EF)`
      : '#ECEAE5',
    border: `2px solid ${c.partyColor || '#D8D4CC'}`,
    color: c.partyColor || '#6B6762',
  };

  return (
    <div
      className="m-candidate-card-mobile"
      onClick={onToggle}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle()}
    >
      {/* Avatar */}
      <div className="m-avatar-wrap">
        {c.photoUrl ? (
          <img src={c.photoUrl} alt={c.name} className="m-card-avatar" />
        ) : (
          <div className="m-card-avatar-placeholder" style={placeholderStyle}>
            {initial}
          </div>
        )}
        <span className={`m-won-dot ${won ? 'won' : 'lost'}`} />
      </div>

      {/* Info */}
      <div className="m-card-info">
        <span className="m-card-name">{c.name}</span>
        <div className="m-card-meta">
          <span className="m-card-party" style={{ color: c.partyColor }}>
            {c.party}
          </span>
          <span className="m-card-sep">·</span>
          <span className="m-card-constituency">
            {c.constituency.split('(')[0]?.trim() || c.constituency}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <span className={`m-card-status ${won ? 'won' : 'lost'}`}>
        {won
          ? (lang === 'en' ? 'WON' : 'வென்றார்')
          : (lang === 'en' ? 'LOST' : 'தோற்றார்')}
      </span>

      {/* Expanded details */}
      {expanded && (
        <div className="m-card-expanded" onClick={e => e.stopPropagation()}>
          <div className="m-card-stat">
            <span className="m-cstat-label">{lang === 'en' ? 'Assets' : 'சொத்து'}</span>
            <span className="m-cstat-value">{c.netWorthFormatted}</span>
          </div>
          <div className="m-card-stat">
            <span className="m-cstat-label">{lang === 'en' ? 'Cases' : 'வழக்குகள்'}</span>
            <span className="m-cstat-value">{c.caseCount}</span>
          </div>
          <button
            className="m-card-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
          >
            {lang === 'en' ? 'Profile →' : 'விவரம் →'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 4. `src/components/ConstituencyMap.tsx` — Mobile touch fix

Find the existing `onConstituencyClick` call inside the SVG path handler. No code changes needed to the map itself — the bottom sheet is wired via `onSelectCandidate` in `Home.tsx` (step 2e above).

**One addition**: add touch-action CSS to prevent scroll-conflict on map SVG.

In `index.css`, add inside the existing `@media (max-width: 480px)` block:

```css
/* Prevent scroll hijack on map touch */
.map-section svg {
  touch-action: none;
}
```

---

## 5. `src/components/Footer.tsx` — Mobile slim override

Wrap existing footer content in desktop-only:

```tsx
// In Footer.tsx, wrap entire return with:
<footer>
  {/* Desktop footer — hidden on mobile */}
  <div className="hidden sm:block">
    {/* ...existing footer JSX unchanged... */}
  </div>

  {/* Mobile footer */}
  <div className="m-footer-override sm:hidden border-t border-neutral-200 bg-[#FCFBF9]">
    <div className="m-footer-links">
      <a href="/affidavits">{lang === 'en' ? 'Directory' : 'பட்டியல்'}</a>
      <a href="/dashboard">{lang === 'en' ? 'Dashboard' : 'டாஷ்போர்டு'}</a>
      <a href="/compare">{lang === 'en' ? 'Compare' : 'ஒப்பிடு'}</a>
    </div>
    <p className="m-footer-legal">
      {lang === 'en'
        ? 'Data sourced from ECI Form 26 affidavits. Not affiliated with any political party or government body.'
        : 'தரவு ECI படிவம் 26 உறுதிமொழிகளிலிருந்து. எந்த அரசியல் கட்சியுடனும் தொடர்பில்லை.'}
    </p>
  </div>
</footer>
```

---

## 6. Hero — Only Addition (no character changes)

Find the existing scroll CTA `<div className="text-center mt-6 sm:mt-8">` and add this **above** it, mobile-only:

```tsx
{/* Mobile: single CTA button below stats */}
<div className="sm:hidden px-4 mt-4">
  <button
    onClick={() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' })}
    className="w-full py-3.5 bg-neutral-900 text-white font-bold text-sm rounded-2xl tracking-wide"
  >
    {lang === 'en' ? 'Explore Candidates →' : 'வேட்பாளர்களை ஆராயுங்கள் →'}
  </button>
</div>
```

---

## 7. Implementation Order

| # | Task | File | Est. |
|---|------|------|------|
| 1 | Add CSS token block to `index.css` | `index.css` | 20 min |
| 2 | Create `MobileCandidateRow.tsx` | new file | 30 min |
| 3 | Add state + scroll hook to `Home.tsx` | `Home.tsx` | 15 min |
| 4 | Replace stats ticker with mobile bar | `Home.tsx` | 15 min |
| 5 | Add sticky search bar | `Home.tsx` | 20 min |
| 6 | Wrap map with banner + legend + sheet | `Home.tsx` | 30 min |
| 7 | Replace candidate list section | `Home.tsx` | 30 min |
| 8 | Wire party filter chips | `Home.tsx` | 15 min |
| 9 | Replace directory CTA block | `Home.tsx` | 10 min |
| 10 | Mobile footer in `Footer.tsx` | `Footer.tsx` | 15 min |
| 11 | Hero CTA button addition | `Home.tsx` | 10 min |
| 12 | Map touch-action fix | `index.css` | 5 min |

**Total: ~3.5 hours**

---

## 8. Type Check

If `Candidate` in `types.ts` lacks `partyColor` or `elected` fields, add:

```ts
// In src/types.ts, inside Candidate interface:
partyColor?: string;
elected?: boolean;
photoUrl?: string;
netWorthFormatted: string;
```

Adjust field names to match actual property names in your `merged_candidates.json`.

---

> All changes are mobile-gated via `sm:hidden` / CSS `@media (max-width: 480px)`. Desktop renders identically to current. Zero breaking changes.
