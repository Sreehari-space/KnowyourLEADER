// scripts/extractEvent.ts
import { callGemini } from "./geminiRotator.js";
import crypto from "crypto";

export interface MlaEvent {
  id: string;
  event_date: string;
  event_type: string;
  summary_en: string;
  summary_ta: string | null;
  severity: "INFO" | "NOTABLE" | "HIGH" | "CRITICAL";
  source_url: string;
  source_domain: string;
  confidence: number;
  ai_curated: true;
}

export async function extractEvent(
  mlaName: string,
  article: { title: string; snippet: string; publishedAt: string; url: string; source: string },
  recentEvents: Pick<MlaEvent, "id" | "event_date" | "summary_en">[] = []
): Promise<MlaEvent | null> {
  const prompt = `You are a Tamil Nadu political journalist AI. Extract a structured event from this news article about MLA "${mlaName}".

TITLE: ${article.title}
SNIPPET: ${article.snippet}
PUBLISHED: ${article.publishedAt}
SOURCE: ${article.source}

EXISTING RECENT EVENTS:
${JSON.stringify(recentEvents, null, 2)}

Return ONLY valid JSON, no markdown, no explanation. Ensure all strings have correctly escaped quotes:
{
  "existing_event_id": "string id of the matching event from the list above if this article is about the exact SAME event, or null if it's a new event",
  "event_date": "YYYY-MM-DD",
  "event_type": "ELECTION|SWORN_IN|ASSEMBLY|LEGAL|CONTROVERSY|STATEMENT|FINANCIAL|DEVELOPMENT|PARTY|OTHER",
  "summary_en": "One sentence max 100 chars in English",
  "summary_ta": "One sentence in Tamil if article is Tamil else null",
  "topic_slug": "2-3 word lowercase hyphen-separated slug of the core event (e.g. 'resignation-from-assembly')",
  "severity": "INFO|NOTABLE|HIGH|CRITICAL",
  "confidence": 0.0 to 1.0,
  "is_about_mla": true or false
}

CRITICAL RULES:
1. ONLY extract events that happened ON OR AFTER May 6, 2026. If the article is entirely about an event before May 6, 2026, return {"confidence": 0.0, "is_about_mla": false}.
2. Local news may only refer to the MLA by their title (e.g., "the TVK MLA", "the MLA from Madurai") rather than their full name. Treat such references as referring to ${mlaName} and mark is_about_mla=true with high confidence.

SEVERITY GUIDE:
INFO     = routine activity, general statement
NOTABLE  = ministry role, major speech, scheme launch
HIGH     = controversy, accusation, protest against MLA
CRITICAL = arrest, conviction, scam allegation, resignation

If MLA is not the main subject return: {"confidence": 0.0, "is_about_mla": false}`;

  try {
    const raw = await callGemini(prompt);
    // Remove markdown code blocks if present
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // AI Engineer Skill: Strict quality gate
    if (!parsed.is_about_mla || parsed.confidence < 0.75) {
      return null;
    }

    // Generate dedup ID using MD5
    const hashInput = `${mlaName}|${parsed.event_date}|${parsed.event_type}|${parsed.topic_slug}`;
    const id = parsed.existing_event_id || crypto.createHash("md5").update(hashInput).digest("hex").slice(0, 8);

    return {
      id,
      event_date: parsed.event_date,
      event_type: parsed.event_type,
      summary_en: parsed.summary_en,
      summary_ta: parsed.summary_ta || null,
      severity: parsed.severity,
      source_url: article.url,
      source_domain: article.source,
      confidence: parsed.confidence,
      ai_curated: true,
    };
  } catch (err: any) {
    console.warn(`[WARN] Failed to extract event for ${mlaName}: ${err.message}`);
    return null;
  }
}
