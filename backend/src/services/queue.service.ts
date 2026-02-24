export class QueueService {
    private queue: (() => Promise<void>)[] = [];
    private isProcessing: boolean = false;
    private static instance: QueueService;

    private constructor() { }

    public static getInstance(): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    public addJob(job: () => Promise<void>) {
        this.queue.push(job);
        this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const job = this.queue.shift();
            if (job) {
                try {
                    await job();
                } catch (error) {
                    console.error('Error processing job:', error);
                }
            }
        }

        this.isProcessing = false;
    }
}

export default QueueService.getInstance();
