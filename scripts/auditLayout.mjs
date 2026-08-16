/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Layout audit — fails the build when text escapes its container.
 *
 *   npm run audit:layout                 # against http://localhost:3001
 *   npm run audit:layout -- --url=...    # against a preview deploy
 *
 * Why this exists
 * ---------------
 * Text was breaking mid-word across the dossier — "Insuranc / e" — because the
 * layout divided width eight levels deep without ever declaring a floor. The
 * narrowest prose container measured 22px. Separately, the directory was
 * hiding 6,437px of declared text per page behind `truncate`.
 *
 * Both were invisible to review: the dossier is nearly clean on a phone and
 * worst on a desktop, because nested `sm:`/`lg:` breakpoints measure the
 * window while the content lives in a container a fraction of its width. Eyes
 * on a laptop at one viewport will not catch that. A machine at three will.
 *
 * The four assertions
 * -------------------
 *   1. No mid-word breaking. A container narrower than its longest word.
 *   2. No clipped declared data. Chrome may be truncated; a candidate's
 *      declaration may not. Fail-closed: anything clipped must opt out with
 *      `data-chrome`, so new truncation is a build failure by default.
 *   3. A measure floor. No prose container below MIN_MEASURE_PX.
 *   4. No sideways scroll on the page body.
 */

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const hit = args.find(a => a.startsWith(`--${flag}=`));
  return hit ? hit.slice(flag.length + 3) : fallback;
};

const BASE = argOf('url', 'http://localhost:3001').replace(/\/$/, '');
const MIN_MEASURE_PX = 160; // ~16rem: the floor below which prose stops working

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 780 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1280, height: 900 },
];

/**
 * The dossier is the hard case and it only misbehaves once the breakdowns are
 * open, so the expanded state is in the matrix rather than the collapsed one.
 */
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'affidavits', path: '/affidavits' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'compare', path: '/compare?left=d-mathiazhagan-dmk-bargur-1452c4a5' },
  { name: 'mla-watch', path: '/mla-watch' },
  // Party pages were outside the matrix until they gained a year selector and
  // the 2021 candidates. The long-name case is the one that stresses layout:
  // the heading is uppercased and set at 6xl.
  { name: 'party (abbrev)', path: '/party/DMK' },
  { name: 'party (long name)', path: '/party/Aanaithinthiya%20Jananayaka%20Pathukappu%20Kazhagam' },
  {
    name: 'dossier (expanded)',
    path: '/?candidate=d-mathiazhagan-dmk-bargur-1452c4a5',
    expandAll: true,
  },
  {
    // A 2021-only candidate. Different loader, different data shape, no
    // photograph and no case split — its own surface, so its own row.
    name: 'dossier 2021-only',
    path: '/affidavits?candidate=a-gnanapandithan-dmdk-cuddalore-2378',
    expandAll: true,
  },
];

/** Runs in the page. Returns violations, never throws. */
function collect(minMeasure) {
  const out = { midWord: [], clipped: [], narrow: [], sideways: false, chars: 0, nodes: 0 };
  out.chars = (document.body.innerText || '').trim().length;
  out.nodes = document.querySelectorAll('*').length;

  const ownText = el =>
    [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2);

  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (!ownText(el)) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;

    /**
     * Width checks only make sense on elements that have a width of their own.
     *
     * A `display: inline` box is sized by the text inside it, so its bounding
     * rect is the rendered text width — measure "2.A.M.Shivani" in a roomy
     * 190px parent and you get 86px, which then looks like a container too
     * narrow for its own content. It is not; it is an inline box doing exactly
     * what inline boxes do. Only block-level containers can genuinely be too
     * narrow, so only they are measured.
     */
    if (cs.display === 'inline') continue;

    const text = el.textContent.trim();
    const where = (el.tagName + '.' + String(el.className || '')).slice(0, 80);

    // 1. mid-word breaking: the box cannot fit its longest word
    if (cs.overflowWrap === 'break-word' || cs.wordBreak === 'break-word' || cs.overflowWrap === 'anywhere') {
      const longest = Math.max(...text.split(/\s+/).map(w => w.length));
      const approxCharPx = parseFloat(cs.fontSize) * 0.55;
      if (longest * approxCharPx > r.width) {
        out.midWord.push({ width: Math.round(r.width), text: text.slice(0, 60), where });
      }
    }

    // 2. clipped text. Chrome opts out; declared data may not be hidden.
    if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 2) {
      if (!el.closest('[data-chrome]')) {
        out.clipped.push({
          hiddenPx: el.scrollWidth - el.clientWidth,
          text: text.slice(0, 60),
          where,
        });
      }
    }

    /**
     * 3. The measure floor, for running text only.
     *
     * The first version of this flagged anything over 20 characters in a box
     * under the floor, which caught "Explore Full Directory" on a button and
     * 400-odd other short labels that wrap perfectly well. A label is not
     * prose. Six words and forty characters is the line: below that, a narrow
     * box is a design choice; above it, it is a column of word-per-line soup.
     */
    const words = text.split(/\s+/).length;
    if (words >= 6 && text.length > 40 && r.width < minMeasure) {
      out.narrow.push({ width: Math.round(r.width), text: text.slice(0, 60), where });
    }
  }

  out.sideways = document.documentElement.scrollWidth > window.innerWidth + 2;
  return out;
}

const browser = await chromium.launch();
const page = await browser.newPage();

// The disclaimer gates every route; accept it once and it persists per context.
await page.addInitScript(() => {
  try { localStorage.setItem('tn_election_disclaimer_accepted', 'true'); } catch {}
});

let failures = 0;
const rows = [];

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });

  for (const route of ROUTES) {
    await page.goto(BASE + route.path, { waitUntil: 'networkidle' });
    // The dossier loads its affidavit chunk after mount.
    await page.waitForTimeout(1200);

    if (route.expandAll) {
      // Every disclosure in the dossier, opened. Matched on aria-expanded
      // rather than on the button's words: this used to look for "break down",
      // and when that copy changed to "Show details" the audit would have gone
      // on passing while quietly no longer opening anything — the widest and
      // densest layout in the app dropping out of the matrix unnoticed.
      // Repeat, because opening a row reveals rows that carry their own control.
      for (let pass = 0; pass < 4; pass++) {
        const clicked = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('button[aria-expanded="false"]')];
          btns.forEach(b => b.click());
          return btns.length;
        });
        if (!clicked) break;
        await page.waitForTimeout(400);
      }
    }

    const r = await page.evaluate(collect, MIN_MEASURE_PX);

    /**
     * Did the page actually render?
     *
     * This check exists because it was needed. A JSX syntax error took
     * FullAffidavit out of the build, every route served an empty shell, and
     * the audit reported a clean pass on all eighteen combinations — an
     * unrendered page has no overflowing text. A guard that goes quiet exactly
     * when the app is broken is worse than no guard, so an empty page is now
     * the loudest failure here.
     */
    const blank = r.chars < 200 || r.nodes < 100;
    const bad = blank
      ? 1
      : r.midWord.length + r.clipped.length + r.narrow.length + (r.sideways ? 1 : 0);
    if (bad) failures += bad;

    rows.push({ vp: vp.name, route: route.name, ...r, bad, blank });

    if (blank) {
      console.log(
        `BLANK ${vp.name.padEnd(8)} ${route.name.padEnd(20)} ` +
        `page did not render — ${r.chars} chars, ${r.nodes} nodes. ` +
        `Check the dev server for a compile error.`
      );
      continue;
    }

    console.log(
      `${(bad ? 'FAIL' : 'ok').padEnd(5)} ${vp.name.padEnd(8)} ${route.name.padEnd(20)} ` +
      `midword=${String(r.midWord.length).padStart(4)} ` +
      `clipped=${String(r.clipped.length).padStart(3)} ` +
      `narrow=${String(r.narrow.length).padStart(4)} ` +
      `sideways=${r.sideways ? 'YES' : 'no'}`
    );
  }
}

await browser.close();

// ─── Detail for whatever failed ─────────────────────────────────────────

const worst = rows.filter(r => r.bad).sort((a, b) => b.bad - a.bad).slice(0, 3);
for (const r of worst) {
  console.log(`\n── ${r.vp} / ${r.route} ──`);
  const show = (label, list) => {
    if (!list.length) return;
    console.log(`  ${label} (${list.length}):`);
    for (const v of list.slice(0, 4)) {
      const size = v.width !== undefined ? `${v.width}px` : `${v.hiddenPx}px hidden`;
      console.log(`    ${size.padEnd(14)} ${JSON.stringify(v.text)}`);
      console.log(`    ${''.padEnd(14)} ${v.where}`);
    }
    if (list.length > 4) console.log(`    … ${list.length - 4} more`);
  };
  show('mid-word breaks', r.midWord);
  show('clipped, not marked data-chrome', r.clipped);
  show(`prose under ${MIN_MEASURE_PX}px`, r.narrow);
  if (r.sideways) console.log('  page scrolls sideways');
}

console.log(
  `\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} violation(s) across ` +
  `${ROUTES.length} routes × ${VIEWPORTS.length} viewports`
);

process.exit(failures === 0 ? 0 : 1);
