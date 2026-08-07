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

  // Non-429 failures previously hit `continue` inside an unbounded `while
  // (true)`, so an invalid key retried forever and the pipeline hung instead of
  // failing. Rate limits still get generous retries; hard errors do not.
  const MAX_ERROR_ATTEMPTS = Math.max(3, KEYS.length * 2);
  let attempt = 0;
  let errorAttempts = 0;
  let lastError: Error | null = null;

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
      lastError = e;
      errorAttempts++;
      console.error(`[WARN] Gemini API error (${errorAttempts}/${MAX_ERROR_ATTEMPTS}): ${e.message}`);

      if (errorAttempts >= MAX_ERROR_ATTEMPTS) {
        throw new Error(
          `Gemini call failed after ${errorAttempts} attempts across ${KEYS.length} key(s). ` +
          `Last error: ${lastError?.message}`
        );
      }

      await new Promise(r => setTimeout(r, 1000 * errorAttempts)); // linear backoff
      continue;
    }
  }
}
