// scripts/testBatch.ts
import fs from "fs";
import path from "path";
import { getMlaList } from "./mlaList.js";
import { fetchMlaArticles } from "./fetchNews.js";
import { extractEvent, MlaEvent } from "./extractEvent.js";

const DATA_DIR = path.join(process.cwd(), "public", "data", "mla-watch");

interface MlaFile {
  mla_id: string;
  mla_name: string;
  constituency: string;
  party: string;
  last_updated: string;
  events: MlaEvent[];
}

function loadExisting(mlaId: string): MlaFile | null {
  const filePath = path.join(DATA_DIR, `${mlaId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveFile(data: MlaFile) {
  const filePath = path.join(DATA_DIR, `${data.mla_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function main() {
  const allMlas = getMlaList();
  
  // Pick specific MLAs for the sample batch
  const testMlas = allMlas.filter(m => 
    m.name.includes("JOSEPH VIJAY")
  ).slice(0, 1);

  console.log(`Running sample batch for: ${testMlas.map(m => m.name).join(', ')}`);

  for (const mla of testMlas) {
    console.log(`\nProcessing: ${mla.name} (${mla.constituency})`);

    const existing = loadExisting(mla.id);
    const existingIds = new Set(existing?.events.map((e) => e.id) || []);
    const events: MlaEvent[] = existing?.events || [];

    const articles = await fetchMlaArticles(mla.name, mla.constituency);
    console.log(`  Found ${articles.length} articles from Bing News.`);

    for (const article of articles) {
      console.log(`  -> Asking Gemini to extract event from: ${article.title}`);
      const event = await extractEvent(mla.name, article);
      if (!event) {
        console.log(`     [Skipped] Gemini returned null or low confidence.`);
        continue;
      }

      if (existingIds.has(event.id)) {
        console.log(`     [Duplicate] Skipping already saved event.`);
        continue;
      }

      events.unshift(event);
      existingIds.add(event.id);
      console.log(`     [Added] ${event.event_type}: ${event.summary_en}`);
    }

    const mlaFile: MlaFile = {
      mla_id: mla.id,
      mla_name: mla.name,
      constituency: mla.constituency,
      party: mla.party,
      last_updated: new Date().toISOString(),
      events,
    };

    saveFile(mlaFile);
    console.log(`  Saved ${events.length} events to ${mla.id}.json`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

main().catch(console.error);
