---
name: layout-contract
description: Layout and text-overflow rules for the TN Leaders transparency portal. Use when changing any JSX/Tailwind layout in src/ — grids, columns, flex rows, cards, the candidate dossier, or anything that displays a candidate's declared data. Covers the measure floor, container queries vs viewport breakpoints, the truncation policy, and the layout audit that must pass before a layout change is called done.
---

# Layout contract

Rules for laying out this site. They exist because text was breaking mid-word
across the dossier — "Insuranc / e", "Corporati / on" — in containers as narrow
as 22px, while the directory hid 6,437px of declared text per page behind
ellipses. Both were fixed by the rules below. Follow them and the failures do
not come back.

## Run the audit. Do not trust your eyes.

```bash
npm run audit:layout        # needs the dev server on :3001
```

Seven routes × three viewports, asserting no mid-word breaks, no clipped
declared data, a 160px measure floor, and no sideways scroll. It must print
`PASS` before a layout change is done.

Two reasons not to skip it:

- **The failure was invisible at one viewport.** The dossier had 1 mid-word
  break at 390px and 359 at 1280px. It got *worse* as the screen got wider,
  because nested breakpoints measure the window while the content sits in a
  container a third its size. Checking on your laptop proves nothing.
- **A blank page has no overflow.** A JSX syntax error once took the dossier out
  of the build and the audit passed all eighteen combinations on empty shells.
  It now fails loudly on a page under 200 characters — but the lesson is to read
  what the audit says, not just its exit code.

## 1. Never let a container divide below the measure floor

**16rem (256px) minimum for prose. 160px is the hard floor the audit enforces.**

Nesting multiplies. In the dossier a card column split, then a card padded,
then a grid split again, then a flex row gave the amount its share — 645px
became 22px across eight levels, and every level was individually reasonable.

Use `auto-fit` + `minmax` so the grid asks its own container instead of a
breakpoint. It yields one column when there is not room for two, with nothing
to keep in sync:

```jsx
// wrong — splits whenever the *window* passes 640px, whatever this box is
<div className="grid gap-3 sm:grid-cols-2">

// right — splits only when this box can hold two 16rem columns
<div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
```

Fixed tracks need a floor too — `minmax(0,210px)` not `210px`, or the track
refuses to shrink and pushes its neighbour under the floor.

## 2. Inside a card or the dossier, use container queries

`sm:` and `lg:` measure the viewport. Anything inside the dossier is at most
65% of it and then padded, so a viewport breakpoint there is deciding on a
width the content does not have.

Mark the scroll pane once, then query it:

```jsx
<div className="@container flex-1 overflow-y-auto p-4 md:p-8">   // in AnimatedCandidateModal
  <div className="columns-1 @2xl:columns-2 gap-3">                // in FullAffidavit
```

Tailwind 4.1 has container queries built in; no plugin. Container sizes are
`@xs` 20rem, `@sm` 24rem, `@md` 28rem, `@lg` 32rem, `@xl` 36rem, `@2xl` 42rem,
`@3xl` 48rem.

If `@container` lands on something that is not the real scroll parent, the
`@2xl:` never matches and the layout silently stays one column forever. Check
that two columns actually appear at desktop.

## 3. Never truncate declared data

This is a disclosure site. Hiding what a candidate declared is a correctness
bug, not a style choice — ugly wrapping shows the data, a clean ellipsis
destroys it. One card was hiding an entire education history, two degrees and
two universities, behind `…`.

- **Chrome** — nav labels, party badges, picker rows, map hover summaries,
  chart axis labels, rounded KPI totals. `truncate` is fine. Mark the element
  `data-chrome` so the audit allows it, and only mark it when the same value
  appears in full somewhere the reader can reach.
- **Declared data** — name, education, occupation, constituency, any affidavit
  value. Never `truncate`. Use `line-clamp-2` with a `title`, or
  `ExpandableText` for a real Read more.

The audit is fail-closed: anything clipping that is not inside `[data-chrome]`
fails the build. That is deliberate — new truncation should have to argue for
itself.

## 4. A disclosure control must be gated on content, not on count

Collapsing detail behind "Show details" is fine. Deciding *when* to offer the
control by counting items is not.

The dossier gated it on `items.length > 1`, which sounds reasonable and hid the
substance of **9,229 of 20,706 declarations** — nearly half. A single declared
property is one item, and its description *is* the declaration: the village, the
survey number, the total area, whether it was inherited, what it cost. All of it
reduced to a bare rupee figure with no way to open it.

Gate on whether there is anything to read:

```js
const detailed =
  items.length > 1 ||
  items.some(i => i.description.trim().length >= 8 || i.attributes.length > 0);
```

A bare cash amount genuinely has nothing behind it and correctly gets no
control. Check the count of rows *without* a control against the data before
believing it.

Two related traps:

- **Label the control for the general case.** "Break down" reads wrong on a
  single property; "Show details" covers both.
- **Never key the audit on button copy.** The expand step matched
  `/break down/i`; renaming the label would have left the audit passing while
  silently no longer opening anything, dropping the densest layout in the app
  out of the matrix. Match `button[aria-expanded="false"]` instead.

## 5. `break-words` is a last resort, and never on numbers

With the measure floor in place, prose wraps normally and `break-words` only
fires on genuinely unbreakable tokens — account numbers, survey numbers, policy
numbers — which is correct. It was never the bug; a 22px container was.

Never on a figure. `break-words` split `₹304.0 Cr` mid-number at 118px. Currency
and counts get `tabular-nums` and no break-words; they wrap at the space before
the unit.

## 6. No Tailwind class names built at runtime

Tailwind scans source for literal strings. A class assembled at runtime is never
generated, and it fails silently — the style just does not exist.

```jsx
<div className={`z-${fig.zBase}`}>          // z-30 was never generated
<p className={`line-clamp-${clamp}`}>       // only line-clamp-2 works, by luck
```

Use the literal class, a lookup object of literal classes, or an inline style.
`z-index` and dynamic opacity belong in `style`.

## 7. Measuring layout in the browser

If you write your own probe, two traps cost real time here:

- **Skip `display: inline`.** An inline box is sized by its text, so its
  bounding rect is the text width. Measuring one and comparing against its
  longest word reports a false failure on perfectly healthy markup.
- **Wait for the data.** The dossier fetches its affidavit chunk after mount,
  and breakdowns must be expanded before the hard case is even in the DOM.
  `networkidle` is not enough on its own.

## Files that carry this contract

- `scripts/auditLayout.mjs` — the guard and the thresholds
- `src/components/FullAffidavit.tsx` — the dossier; densest layout in the app
- `src/components/AnimatedCandidateModal.tsx` — owns the `@container` root
- `src/components/CandidateCard.tsx` — the truncation policy in practice
