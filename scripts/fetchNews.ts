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

export async function fetchMlaArticles(
  mlaName: string,
  constituency: string
): Promise<Article[]> {
  const cleanName = mlaName.replace(/^[A-Z\.]+\s*/i, '').replace(/\(Winner\)/ig, '').trim();
  const cleanConst = constituency.replace(/\(.*?\)/g, '').trim();

  const query = encodeURIComponent(`${cleanName} ${cleanConst} MLA Tamil Nadu`);
  const rssUrl = `https://www.bing.com/news/search?q=${query}&format=RSS`;

  try {
    const feed = await parser.parseURL(rssUrl);
    
    // Filter by date first
    const CUTOFF_DATE = new Date("2026-05-06T00:00:00Z");
    
    const recentItems = feed.items.filter(item => {
      if (!item.pubDate) return false;
      const pubDate = new Date(item.pubDate);
      return pubDate >= CUTOFF_DATE;
    });

    // Process URLs sequentially to avoid spamming HEAD requests
    const resolvedArticles: Article[] = [];
    
    for (const item of recentItems) {
      const rawUrl = item.link || "";
      const realUrl = await resolveUrl(rawUrl);
      
      try {
        const domain = new URL(realUrl).hostname.replace("www.", "");
        resolvedArticles.push({
          title: item.title || "",
          url: realUrl,
          publishedAt: item.pubDate || new Date().toISOString(),
          snippet: item.contentSnippet || item.content || "",
          source: domain,
        });
      } catch {
        continue;
      }
    }

    return resolvedArticles;
  } catch (err: any) {
    console.error(`[ERROR] fetchNews failed for ${mlaName}:`, err.message);
    return [];
  }
}
