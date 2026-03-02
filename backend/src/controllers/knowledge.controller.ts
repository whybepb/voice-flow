import { Request, Response, NextFunction } from 'express';
import path from 'path';
import prisma from '../prisma';
import { AppError } from '../middlewares/errorHandler';
import { getUserOpenAIKey } from '../services/user-secrets.service';
import { enqueueKnowledgeIngestJob } from '../services/background-job-handlers';
import {
    searchKnowledge,
    buildRAGPrompt,
    generateRAGAnswer,
    listDocuments,
    deleteDocument,
    reindexDocument,
} from '../services/rag.service';

// ─── Upload & Ingest ───────────────────────────────────────────────

export const uploadKnowledge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        const userId = req.user!.id;
        const file = req.file;
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

        // Create document record immediately (status: PROCESSING)
        const document = await prisma.knowledgeDocument.create({
            data: {
                userId,
                fileName: file.originalname,
                fileType: ext,
                fileSize: file.size,
                rawContent: '', // will be filled during ingestion
                status: 'PROCESSING',
            },
        });

        // Enqueue ingestion as a tracked background job.
        await enqueueKnowledgeIngestJob(userId, document.id, file.path);

        res.status(201).json({
            status: 'success',
            message: 'Document uploaded. Processing will complete in the background.',
            data: {
                id: document.id,
                fileName: document.fileName,
                fileType: document.fileType,
                fileSize: document.fileSize,
                status: document.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── List Documents ─────────────────────────────────────────────────

export const getKnowledgeDocs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const docs = await listDocuments(req.user!.id);

        res.status(200).json({
            status: 'success',
            data: docs,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Delete Document ────────────────────────────────────────────────

export const deleteKnowledgeDoc = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const deleted = await deleteDocument(req.user!.id, id);

        if (!deleted) {
            return next(new AppError('Document not found or you do not have permission', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Document and all associated chunks deleted.',
        });
    } catch (error) {
        next(error);
    }
};

// ─── Re-index Document ──────────────────────────────────────────────

export const reindexKnowledgeDoc = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const success = await reindexDocument(req.user!.id, id);

        if (!success) {
            return next(new AppError('Document not found or you do not have permission', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Document re-indexing started. This will complete in the background.',
        });
    } catch (error) {
        next(error);
    }
};

// ─── Query Knowledge Base ───────────────────────────────────────────

export const queryKnowledge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, topK, generateAnswer } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return next(new AppError('Please provide a non-empty query string', 400));
        }

        const k = Math.min(Math.max(1, topK || 5), 20); // clamp between 1 and 20
        const results = await searchKnowledge(req.user!.id, query.trim(), k);
        const ragContext = buildRAGPrompt(query.trim(), results);

        let answer: string | undefined = undefined;
        if (generateAnswer) {
            const apiKey = await getUserOpenAIKey(req.user!.id);
            if (apiKey) {
                answer = await generateRAGAnswer(ragContext.prompt, apiKey);
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                query: query.trim(),
                results: results.map((r) => ({
                    chunkId: r.chunkId,
                    content: r.content,
                    chunkIndex: r.chunkIndex,
                    documentId: r.documentId,
                    fileName: r.fileName,
                    similarity: Math.round(r.similarity * 1000) / 1000, // 3 decimal places
                })),
                ragPrompt: ragContext.prompt,
                sources: ragContext.sources,
                answer,
            },
        });
    } catch (error) {
        next(error);
    }
};
