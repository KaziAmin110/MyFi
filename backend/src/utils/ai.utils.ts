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

/**
 * Call Gemini AI for chat completion
 * Uses gemini-2.5-flash model for fast, cost-effective responses
 */
export const callAI = async (
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "model"; text: string }> = []
): Promise<string> => {
  try {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error("User message cannot be empty");
    }

    // Build conversation history in Gemini format
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini API");
    }

    return response.text;
  } catch (error: any) {
    console.error("Error calling Gemini AI:", error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
};
