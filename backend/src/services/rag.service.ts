import prisma from '../prisma';
import { extractText } from '../utils/text-extractor';
import { chunkText, Chunk } from '../utils/chunker';
import { generateEmbedding, generateEmbeddings } from './embedding.service';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import OpenAI from 'openai';

// ─── Types ──────────────────────────────────────────────────────────

export interface SearchResult {
    chunkId: string;
    content: string;
    chunkIndex: number;
    documentId: string;
    fileName: string;
    similarity: number;
}

export interface RAGContext {
    prompt: string;
    sources: { fileName: string; chunkIndex: number; similarity: number }[];
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ─── Document Ingestion ─────────────────────────────────────────────

/**
 * Ingest a document: extract text → chunk → embed → store.
 * Runs async — caller should not await this in the request handler.
 */
export async function ingestDocument(
    userId: string,
    documentId: string,
    filePath: string,
): Promise<void> {
    let rawContent = '';
    try {
        console.log(`[RAG] Starting ingestion for document ${documentId}`);

        // 1. Extract text
        rawContent = await extractText(filePath);
        console.log(`[RAG] Extracted ${rawContent.length} chars from file`);

        // 2. Chunk the text
        const chunks: Chunk[] = chunkText(rawContent);
        console.log(`[RAG] Created ${chunks.length} chunks`);

        if (chunks.length === 0) {
            await prisma.knowledgeDocument.update({
                where: { id: documentId },
                data: { status: 'FAILED', rawContent: rawContent || 'Empty document' },
            });
            return;
        }

        // 3. Generate embeddings in batch
        const texts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(texts);
        console.log(`[RAG] Generated ${embeddings.length} embeddings`);

        // 4. Store chunks with embeddings using raw SQL (Prisma can't handle vector type directly)
        for (let i = 0; i < chunks.length; i++) {
            const id = randomUUID();
            const embeddingStr = `[${embeddings[i].join(',')}]`;

            await prisma.$executeRaw`
                INSERT INTO "KnowledgeChunk" (id, "documentId", content, "chunkIndex", embedding, "createdAt")
                VALUES (${id}, ${documentId}, ${chunks[i].content}, ${chunks[i].chunkIndex}, ${embeddingStr}::vector, NOW())
            `;
        }

        // 5. Update document status
        await prisma.knowledgeDocument.update({
            where: { id: documentId },
            data: {
                status: 'READY',
                rawContent,
                chunkCount: chunks.length,
            },
        });

        console.log(`[RAG] ✅ Document ${documentId} ingested successfully (${chunks.length} chunks)`);
    } catch (error) {
        console.error(`[RAG] ❌ Ingestion failed for document ${documentId}:`, error);

        // Mark document as failed
        await prisma.knowledgeDocument.update({
            where: { id: documentId },
            data: { status: 'FAILED' },
        }).catch(() => { }); // swallow if the doc itself was deleted
    } finally {
        await fs.unlink(filePath).catch(() => { });
    }
}

// ─── Vector Search ──────────────────────────────────────────────────

/**
 * Search the knowledge base for chunks similar to the query.
 * Results are scoped to the given userId (multi-tenant isolation).
 * 
 * @param userId - Owner of the knowledge base to search
 * @param query  - Natural language search query
 * @param topK   - Number of top results to return (default 5)
 * @returns Array of search results with similarity scores and source citations
 */
export async function searchKnowledge(
    userId: string,
    query: string,
    topK: number = 5,
): Promise<SearchResult[]> {
    // 1. Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // 2. Vector similarity search scoped to user's documents
    const results: SearchResult[] = await prisma.$queryRaw`
        SELECT 
            kc.id AS "chunkId",
            kc.content,
            kc."chunkIndex",
            kc."documentId",
            kd."fileName",
            (1 - (kc.embedding <=> ${embeddingStr}::vector)) AS similarity
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
        WHERE kd."userId" = ${userId}
          AND kd.status = 'READY'
        ORDER BY kc.embedding <=> ${embeddingStr}::vector
        LIMIT ${topK}
    `;

    // Convert Decimal similarity to number
    return results.map((r) => ({
        ...r,
        similarity: Number(r.similarity),
    }));
}

// ─── RAG Prompt Builder ─────────────────────────────────────────────

/**
 * Build a RAG-augmented prompt from search results.
 * Returns the formatted context and source citations.
 */
export function buildRAGPrompt(query: string, results: SearchResult[]): RAGContext {
    if (results.length === 0) {
        return {
            prompt: `The user asked: "${query}"\n\nNo relevant information was found in the company knowledge base.`,
            sources: [],
        };
    }

    const contextBlocks = results.map((r, i) => {
        return `[Source ${i + 1}: ${r.fileName}, chunk ${r.chunkIndex + 1}] (relevance: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`;
    });

    const prompt = `The user asked: "${query}"

Here is relevant information from the company knowledge base:

---
${contextBlocks.join('\n\n---\n')}
---

Answer the user's question based on the above information. Cite which source document you used. If the information doesn't fully answer the question, say what you found and offer to connect them with a human agent.`;

    const sources = results.map((r) => ({
        fileName: r.fileName,
        chunkIndex: r.chunkIndex,
        similarity: r.similarity,
    }));

    return { prompt, sources };
}

/**
 * Generate a concise answer using the RAG prompt.
 */
export async function generateRAGAnswer(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are a concise, professional assistant. Answer using only the provided context.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || '';
}

// ─── CRUD Operations ────────────────────────────────────────────────

/**
 * List all knowledge documents for a user.
 */
export async function listDocuments(userId: string) {
    return prisma.knowledgeDocument.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            chunkCount: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}

/**
 * Delete a knowledge document and all its chunks (cascade).
 * Enforces ownership check.
 */
export async function deleteDocument(userId: string, documentId: string): Promise<boolean> {
    const doc = await prisma.knowledgeDocument.findFirst({
        where: { id: documentId, userId },
    });

    if (!doc) return false;

    await prisma.knowledgeDocument.delete({
        where: { id: documentId },
    });

    return true;
}

/**
 * Re-index a document: delete existing chunks, re-extract, re-chunk, re-embed.
 * Runs async — returns immediately after setting status to PROCESSING.
 */
export async function reindexDocument(
    userId: string,
    documentId: string,
): Promise<boolean> {
    const doc = await prisma.knowledgeDocument.findFirst({
        where: { id: documentId, userId },
    });

    if (!doc) return false;

    // Delete existing chunks
    await prisma.knowledgeChunk.deleteMany({
        where: { documentId },
    });

    // Reset status
    await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { status: 'PROCESSING', chunkCount: 0 },
    });

    // Re-ingest using stored raw content (no file needed)
    reindexFromContent(documentId, doc.rawContent).catch((err) => {
        console.error(`[RAG] Re-index failed for ${documentId}:`, err);
    });

    return true;
}

/**
 * Re-ingest from stored raw content (used during re-indexing).
 */
async function reindexFromContent(documentId: string, rawContent: string): Promise<void> {
    try {
        const chunks = chunkText(rawContent);
        if (chunks.length === 0) {
            await prisma.knowledgeDocument.update({
                where: { id: documentId },
                data: { status: 'FAILED', chunkCount: 0 },
            });
            return;
        }
        const texts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(texts);

        for (let i = 0; i < chunks.length; i++) {
            const id = randomUUID();
            const embeddingStr = `[${embeddings[i].join(',')}]`;

            await prisma.$executeRaw`
                INSERT INTO "KnowledgeChunk" (id, "documentId", content, "chunkIndex", embedding, "createdAt")
                VALUES (${id}, ${documentId}, ${chunks[i].content}, ${chunks[i].chunkIndex}, ${embeddingStr}::vector, NOW())
            `;
        }

        await prisma.knowledgeDocument.update({
            where: { id: documentId },
            data: { status: 'READY', chunkCount: chunks.length },
        });

        console.log(`[RAG] ✅ Re-indexed document ${documentId} (${chunks.length} chunks)`);
    } catch (error) {
        console.error(`[RAG] ❌ Re-index failed for ${documentId}:`, error);
        await prisma.knowledgeDocument.update({
            where: { id: documentId },
            data: { status: 'FAILED' },
        }).catch(() => { });
    }
}
