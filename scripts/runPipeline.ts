// scripts/runPipeline.ts
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

function updateIndex(allMlas: MlaFile[]) {
  const index = allMlas.map((m) => ({
    mla_id: m.mla_id,
    mla_name: m.mla_name,
    constituency: m.constituency,
    party: m.party,
    event_count: m.events.length,
    latest_event_date: m.events[0]?.event_date || null,
    latest_severity: m.events[0]?.severity || null,
  }));
  fs.writeFileSync(
    path.join(DATA_DIR, "_index.json"),
    JSON.stringify(index, null, 2)
  );
}

async function main() {
  // Ensure public/data/mla-watch exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const allFiles: MlaFile[] = [];
  let totalInserted = 0;

  const mlaList = getMlaList();
  console.log(`Starting pipeline for ${mlaList.length} MLAs...`);

  for (const mla of mlaList) {
    console.log(`Processing: ${mla.name} (${mla.constituency})`);

    // Load existing data
    const existing = loadExisting(mla.id);
    const existingIds = new Set(existing?.events.map((e) => e.id) || []);
    const events: MlaEvent[] = existing?.events || [];

    // Fetch news
    const articles = await fetchMlaArticles(mla.name, mla.constituency);

    for (const article of articles) {
      const recentEvents = events.slice(0, 5).map(e => ({ id: e.id, event_date: e.event_date, summary_en: e.summary_en }));
      const event = await extractEvent(mla.name, article, recentEvents);

      // Delay to prevent API burst rate limits
      await new Promise((r) => setTimeout(r, 1500));

      if (!event) continue;

      // Dedup check
      if (existingIds.has(event.id)) {
        console.log(`  Skipped duplicate: ${event.id}`);
        continue;
      }

      events.unshift(event); // newest first
      existingIds.add(event.id);
      totalInserted++;
      console.log(`  Added: [${event.event_type}] ${event.summary_en}`);
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
    allFiles.push(mlaFile);

    // Stagger — don't hammer Google News or Gemini
    await new Promise((r) => setTimeout(r, 600));
  }

  updateIndex(allFiles);
  console.log(`\nPipeline Complete. Total new events: ${totalInserted}`);
}

main().catch((err) => {
  console.error("Pipeline crashed:", err);
  process.exit(1);
});
