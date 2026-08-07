/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Document head management.
 *
 * Why this exists instead of react-helmet-async:
 *
 * react-helmet-async@3 is a pass-through on React 19 — React itself hoists
 * `<title>`, `<meta>`, `<link>` and `<script>` into the head, and it does NOT
 * deduplicate them by name. So the tags declared in index.html and the tags
 * rendered by each page both ended up in the head, and every page shipped two
 * `<title>` elements and two or three `<meta name="description">` tags. A
 * crawler is free to pick either, which meant a candidate page could be indexed
 * and shared under the generic site blurb.
 *
 * This module upserts instead: it finds the existing tag and rewrites its
 * content, creating one only if none exists. The tags in index.html stay put
 * and stay authoritative for crawlers that do not execute JavaScript — they are
 * the same elements this code then updates.
 *
 * Note for share previews: crawlers that don't run JS (Twitterbot among them)
 * only ever see index.html's static tags. Per-candidate share cards need
 * prerendering or an edge worker; no client-side approach can deliver them.
 */

import { useEffect } from 'react';

export interface DocumentMeta {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  jsonLd?: unknown;
}

const SITE_NAME = 'TN Leaders';
const SITE_URL = 'https://tn-leaders.pages.dev';

const DEFAULT_KEYWORDS =
  'M K Stalin assets 2026, Edappadi Palaniswami net worth, K Annamalai election affidavit, ' +
  'Seeman criminal cases, Tamil Nadu election 2026 candidates, ECI Form 26 election portal, ' +
  'candidate affidavits TN 2026, political assets database Tamil Nadu';

/** Find the single tag matching `selector`, or create it in the head. */
function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) return existing;
  const el = create();
  document.head.appendChild(el);
  return el;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  const el = upsert(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  });
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  const el = upsert(`link[rel="${rel}"]`, () => {
    const l = document.createElement('link');
    l.setAttribute('rel', rel);
    return l;
  });
  el.setAttribute('href', href);
}

function setJsonLd(data: unknown) {
  const el = upsert('script#seo-schema', () => {
    const s = document.createElement('script');
    s.setAttribute('type', 'application/ld+json');
    s.id = 'seo-schema';
    return s;
  });
  el.textContent = JSON.stringify(data);
}

/**
 * Apply page metadata to the document head.
 *
 * Every field is written on every call — including the ones a page does not
 * customise — so values never leak from the previously visited route.
 */
export function useDocumentMeta(meta: DocumentMeta) {
  const {
    title, description, canonical,
    keywords = DEFAULT_KEYWORDS,
    ogTitle = title,
    ogDescription = description,
    jsonLd,
  } = meta;

  useEffect(() => {
    document.title = title;

    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setLink('canonical', canonical);

    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:title', ogTitle);
    setMeta('property', 'og:description', ogDescription);
    setMeta('property', 'og:image', `${SITE_URL}/og-image.jpg`);

    setMeta('property', 'twitter:card', 'summary_large_image');
    setMeta('property', 'twitter:url', canonical);
    setMeta('property', 'twitter:title', ogTitle);
    setMeta('property', 'twitter:description', ogDescription);
    setMeta('property', 'twitter:image', `${SITE_URL}/og-image.jpg`);

    setJsonLd(
      jsonLd ?? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        description,
        url: canonical,
      }
    );
  }, [title, description, canonical, keywords, ogTitle, ogDescription, jsonLd]);
}
