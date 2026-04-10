import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Generate embedding for text using Gemini gemini-embedding-001 model
 * Returns normalized 768-dimensional embedding vector
 */
export const generateEmbedding = async (
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        taskType: taskType,
        outputDimensionality: 768,
      },
    });

    if (
      !response.embeddings ||
      response.embeddings.length === 0 ||
      !response.embeddings[0].values
    ) {
      throw new Error("No embedding returned from Gemini API");
    }

    const embedding = response.embeddings[0].values;

    // Normalize the embedding for 768 dimensions (as per Gemini docs)
    const norm = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    const normalized = embedding.map((val) => val / norm);

    return normalized;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/** Errors from the Gemini API that are worth retrying (transient / high-demand) */
const isRetriable = (err: any): boolean => {
  const msg: string = (err?.message || "").toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("overloaded") ||
    msg.includes("high demand")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Model cascade for chat completion.
 *
 * gemini-2.5-flash  — best quality, but preview capacity can be limited.
 * gemini-2.0-flash  — stable GA model, much higher capacity, nearly identical
 *                     quality for conversational coaching tasks.
 *
 * Strategy:
 *   1. Try gemini-2.5-flash up to 2 times (1 s delay between attempts).
 *   2. If both attempts fail with a retriable error (503/429/UNAVAILABLE),
 *      switch to gemini-2.0-flash and try once more.
 *   3. Non-retriable errors (auth, bad input, etc.) fail immediately.
 */
const MODEL_CASCADE = [
  { model: "gemini-2.5-flash", maxAttempts: 2 },
  { model: "gemini-2.0-flash", maxAttempts: 1 },
];
const RETRY_DELAY_MS = 1000;

export const callAI = async (
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "model"; text: string }> = []
): Promise<string> => {
  if (!userMessage || userMessage.trim().length === 0) {
    throw new Error("User message cannot be empty");
  }

  // Build contents once — reused across all attempts and models
  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: userMessage }],
    },
  ];

  let lastError: any;

  for (const { model, maxAttempts } of MODEL_CASCADE) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        if (!response.text) {
          throw new Error("No response text from Gemini API");
        }

        if (model !== "gemini-2.5-flash") {
          console.info(`[callAI] Responded via fallback model: ${model}`);
        }

        return response.text;
      } catch (error: any) {
        lastError = error;

        // Non-retriable (auth failure, bad request, etc.) — stop immediately
        if (!isRetriable(error)) {
          console.error(`[callAI] Non-retriable error (${model} attempt ${attempt}):`, error.message);
          throw new Error(`Failed to get AI response: ${error.message}`);
        }

        // Retriable — log and maybe wait before next attempt or next model
        const hasMoreAttemptsOnThisModel = attempt < maxAttempts;
        if (hasMoreAttemptsOnThisModel) {
          console.warn(
            `[callAI] ${model} overloaded (attempt ${attempt}/${maxAttempts}). Retrying in ${RETRY_DELAY_MS}ms...`
          );
          await sleep(RETRY_DELAY_MS);
        } else {
          console.warn(
            `[callAI] ${model} exhausted (attempt ${attempt}/${maxAttempts}). Trying next model...`
          );
        }
      }
    }
  }

  throw new Error(`Failed to get AI response: ${lastError?.message ?? "Unknown error"}`);
};


