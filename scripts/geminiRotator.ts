// scripts/geminiRotator.ts
import dotenv from 'dotenv';
dotenv.config();

const KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_KEY_6,
  process.env.GEMINI_KEY_7,
  process.env.GEMINI_KEY_8,
  process.env.GEMINI_KEY_9,
].filter(Boolean) as string[];

let idx = 0;

export async function callGemini(prompt: string): Promise<string> {
  if (KEYS.length === 0) {
    throw new Error("No Gemini keys found! Please add GEMINI_KEY_1 to your .env file.");
  }

  let attempt = 0;
  
  while (true) {
    const key = KEYS[idx];
    idx = (idx + 1) % KEYS.length;
    attempt++;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              responseMimeType: "application/json"
            },
          }),
        }
      );

      if (res.status === 429) {
        console.warn(`[WARN] Rate limit hit on key index ${idx}. Rotating...`);
        // If we've tried multiple keys and still hitting 429, wait longer
        const waitTime = attempt >= KEYS.length ? 60000 : 2000;
        if (attempt >= KEYS.length) console.warn(`[WARN] All keys exhausted. Pausing pipeline for 60s to reset quota...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e: any) {
      console.error(`[WARN] Gemini API error: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000)); // exponential backoff could be added here
      continue;
    }
  }
}
