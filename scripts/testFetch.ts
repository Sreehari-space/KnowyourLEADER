import { fetchMlaArticles } from './fetchNews.js';

async function test() {
  console.log("Fetching for A.KALLANAI...");
  const articles = await fetchMlaArticles('A.KALLANAI', 'MADURAI NORTH  (MADURAI)');
  console.log(articles);
}

test();
