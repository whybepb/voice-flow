import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions, $0.02/1M tokens
const MAX_BATCH_SIZE = 2048;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an embedding vector for a single text string.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
    });
    return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * OpenAI supports up to 2048 inputs per request.
 * Automatically batches if needed.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allEmbeddings: number[][] = [];

    // Process in batches of MAX_BATCH_SIZE
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
        const batch = texts.slice(i, i + MAX_BATCH_SIZE);

        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: batch,
        });

        // Results come in order of input
        const batchEmbeddings = response.data
            .sort((a, b) => a.index - b.index)
            .map((d) => d.embedding);

        allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
}
