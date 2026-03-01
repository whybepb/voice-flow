import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authGuard } from '../middlewares/auth.middleware';
import { upload, handleUploadError } from '../middlewares/upload.middleware';
import {
    uploadKnowledge,
    getKnowledgeDocs,
    deleteKnowledgeDoc,
    reindexKnowledgeDoc,
    queryKnowledge,
} from '../controllers/knowledge.controller';

const router = Router();

// ─── Rate Limiters ──────────────────────────────────────────────────

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 10,                    // 10 uploads per hour per IP
    message: { status: 'error', message: 'Too many uploads. Try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const queryLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 60,                    // 60 queries per minute per IP
    message: { status: 'error', message: 'Too many queries. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Routes ─────────────────────────────────────────────────────────

// All routes require authentication
router.use(authGuard);

// Upload a knowledge document (PDF/TXT)
router.post('/upload', uploadLimiter, upload.single('file'), handleUploadError, uploadKnowledge);

// List all knowledge documents
router.get('/', getKnowledgeDocs);

// Delete a knowledge document
router.delete('/:id', deleteKnowledgeDoc);

// Re-index a knowledge document
router.post('/:id/reindex', reindexKnowledgeDoc);

// Query the knowledge base (RAG search)
router.post('/query', queryLimiter, queryKnowledge);

export default router;
