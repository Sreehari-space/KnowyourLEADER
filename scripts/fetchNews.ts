// scripts/fetchNews.ts
import Parser from "rss-parser";
import { TRUSTED_SOURCES } from "./sources.js";

const parser = new Parser({
  customFields: {
    item: ['contentSnippet', 'content']
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  }
});

export interface Article {
  title: string;
  url: string;
  publishedAt: string;
  snippet: string;
  source: string;
}

// Function to unwrap Bing News redirect URLs
async function resolveUrl(url: string): Promise<string> {
  if (!url.includes("bing.com/news/apiclick.aspx")) return url;
  
  try {
    // Attempt to follow redirect
    const res = await fetch(url, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) return location;
    }
    
    // Fallback: extract from query param
    const urlParam = new URL(url).searchParams.get("url");
    if (urlParam) return urlParam;
    
  } catch (err) {
    // Fallback: extract from query param
    try {
      const urlParam = new URL(url).searchParams.get("url");
      if (urlParam) return urlParam;
    } catch {}
  }
  return url;
}

const HONORIFICS = new Set(['dr', 'mr', 'mrs', 'ms', 'thiru', 'tmt', 'selvi', 'prof', 'adv', 'er']);

/**
 * Build a searchable name.
 *
 * The previous implementation used /^[A-Z\.]+\s*/i, and because of the `i`
 * flag that character class matches *any* letters — so it ate the whole first
 * word of an upper-case name: "LEEMAROSE MARTIN" became "MARTIN" and
 * "AADHAV ARJUNA" became "ARJUNA". Searches were then run for the wrong person.
 *
 * Drop honorifics and standalone initials, keep every substantive word.
 */
export function toSearchableName(mlaName: string): string {
  const words = String(mlaName || '')
    .replace(/\(\s*winner\s*\)/gi, ' ')
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .filter(w => w.length > 1 && !HONORIFICS.has(w.toLowerCase()));

  const titled = words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return titled.join(' ').trim() || String(mlaName || '').trim();
}

const CUTOFF_DATE = new Date(process.env.MLA_WATCH_SINCE || '2026-05-06T00:00:00Z');

/** Google News carries far more Indian regional coverage than Bing. */
function feedUrls(query: string): Array<{ label: string; url: string }> {
  const q = encodeURIComponent(query);
  return [
    { label: 'google', url: `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en` },
    { label: 'bing', url: `https://www.bing.com/news/search?q=${q}&format=RSS` },
  ];
}

export async function fetchMlaArticles(
  mlaName: string,
  constituency: string
): Promise<Article[]> {
  const cleanName = toSearchableName(mlaName);
  const cleanConst = constituency.replace(/\(.*?\)/g, '').trim();
  const query = `${cleanName} ${cleanConst} MLA Tamil Nadu`;

  const seen = new Set<string>();
  const resolvedArticles: Article[] = [];
  let fetched = 0;
  let staleDropped = 0;

  for (const feed of feedUrls(query)) {
    let items;
    try {
      items = (await parser.parseURL(feed.url)).items;
    } catch (err: any) {
      console.warn(`[WARN] ${feed.label} feed failed for ${cleanName}: ${err.message}`);
      continue;
    }

    fetched += items.length;

    for (const item of items) {
      if (!item.pubDate || new Date(item.pubDate) < CUTOFF_DATE) {
        staleDropped++;
        continue;
      }

      const realUrl = await resolveUrl(item.link || '');
      let domain: string;
      try {
        domain = new URL(realUrl).hostname.replace('www.', '');
      } catch {
        continue;
      }

      // The same story is often syndicated across both feeds.
      const key = (item.title || '').toLowerCase().replace(/\W+/g, '').slice(0, 80) || realUrl;
      if (seen.has(key)) continue;
      seen.add(key);

      resolvedArticles.push({
        title: item.title || '',
        url: realUrl,
        publishedAt: item.pubDate || new Date().toISOString(),
        snippet: item.contentSnippet || item.content || '',
        source: domain,
      });
    }
  }

  console.log(
    `  news: ${resolvedArticles.length} usable (${fetched} fetched, ${staleDropped} before cutoff) — "${query}"`
  );
  return resolvedArticles;
}
