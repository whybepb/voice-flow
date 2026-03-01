export interface Chunk {
    content: string;
    chunkIndex: number;
}

// Rough token estimate: 1 token ≈ 4 chars for English text
const CHARS_PER_TOKEN = 4;
const DEFAULT_CHUNK_SIZE_TOKENS = 500;    // ~2000 chars
const DEFAULT_OVERLAP_TOKENS = 50;        // ~200 chars
const MAX_CHUNK_TOKENS = 8000;            // hard cap to stay under embedding model limit (8192)

/**
 * Split text into overlapping chunks that respect sentence boundaries.
 * 
 * @param text           - The full text to chunk
 * @param chunkSize      - Target chunk size in tokens (default 500)
 * @param overlapTokens  - Overlap between consecutive chunks in tokens (default 50)
 * @returns Array of chunks with content and index
 */
export function chunkText(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE_TOKENS,
    overlapTokens: number = DEFAULT_OVERLAP_TOKENS,
): Chunk[] {
    if (!text || text.trim().length === 0) return [];

    const chunkChars = Math.min(chunkSize, MAX_CHUNK_TOKENS) * CHARS_PER_TOKEN;
    const overlapChars = overlapTokens * CHARS_PER_TOKEN;

    // Split into sentences first for cleaner boundaries
    const sentences = splitIntoSentences(text);
    const chunks: Chunk[] = [];

    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
        // If a single sentence exceeds the chunk size, split it by character
        if (sentence.length > chunkChars) {
            // Flush current chunk first
            if (currentChunk.trim()) {
                chunks.push({ content: currentChunk.trim(), chunkIndex: chunkIndex++ });
            }

            // Split the long sentence into sub-chunks
            for (let i = 0; i < sentence.length; i += chunkChars - overlapChars) {
                const subChunk = sentence.slice(i, i + chunkChars).trim();
                if (subChunk) {
                    chunks.push({ content: subChunk, chunkIndex: chunkIndex++ });
                }
            }
            currentChunk = '';
            continue;
        }

        // Will this sentence fit in the current chunk?
        if (currentChunk.length + sentence.length > chunkChars) {
            // Save current chunk
            if (currentChunk.trim()) {
                chunks.push({ content: currentChunk.trim(), chunkIndex: chunkIndex++ });
            }

            // Start new chunk with overlap from the end of the previous one
            const overlapText = currentChunk.slice(-overlapChars);
            currentChunk = overlapText + sentence;
        } else {
            currentChunk += sentence;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), chunkIndex: chunkIndex++ });
    }

    return chunks;
}

/**
 * Split text into sentences, keeping the delimiter (period, !, ?) attached.
 * Handles common abbreviations to avoid false splits.
 */
function splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by whitespace
    // Negative lookbehind for common abbreviations (Mr., Dr., etc.)
    const raw = text.split(/(?<=[.!?])\s+/);

    // Re-join split abbreviations and return
    const sentences: string[] = [];
    for (const part of raw) {
        if (part.trim()) {
            sentences.push(part.trim() + ' ');
        }
    }

    return sentences;
}

/**
 * Estimate token count for a string.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}
