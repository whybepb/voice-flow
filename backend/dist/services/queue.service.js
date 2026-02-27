"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
class QueueService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }
    static getInstance() {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }
    addJob(job) {
        this.queue.push(job);
        this.processQueue();
    }
    async processQueue() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const job = this.queue.shift();
            if (job) {
                try {
                    await job();
                }
                catch (error) {
                    console.error('Error processing job:', error);
                }
            }
        }
        this.isProcessing = false;
    }
}
exports.QueueService = QueueService;
exports.default = QueueService.getInstance();
