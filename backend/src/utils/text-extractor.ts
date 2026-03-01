import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require('pdf-parse');

/**
 * Extract plain text from an uploaded file.
 * Supports PDF and TXT formats.
 */
export async function extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.pdf':
            return extractFromPDF(filePath);
        case '.txt':
            return extractFromTXT(filePath);
        default:
            throw new Error(`Unsupported file type: ${ext}. Only .pdf and .txt are supported.`);
    }
}

async function extractFromPDF(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains no extractable text.');
    }

    return cleanText(data.text);
}

async function extractFromTXT(filePath: string): Promise<string> {
    const content = fs.readFileSync(filePath, 'utf-8');

    if (!content || content.trim().length === 0) {
        throw new Error('TXT file is empty.');
    }

    return cleanText(content);
}

/**
 * Normalize whitespace and remove control characters.
 */
function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')            // normalize line endings
        .replace(/\r/g, '\n')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // remove control chars
        .replace(/\n{3,}/g, '\n\n')         // collapse multiple blank lines
        .replace(/[ \t]{2,}/g, ' ')         // collapse multiple spaces/tabs
        .trim();
}
