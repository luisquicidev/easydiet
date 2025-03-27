// src/modules/diet/processors/diet-queue.processor.ts

import { Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

// Este processador está desativado e mantido apenas como estrutura para implementação futura
@Processor('diet-generation')
export class DietQueueProcessor {
    private readonly logger = new Logger(DietQueueProcessor.name);

    // Mantenha esta classe vazia ou adicione métodos stub conforme necessário para desenvolvimento futuro
    constructor() {
        this.logger.log('Diet Queue Processor inicializado (modo stub)');
    }

    // Exemplo de stub de processador para uso futuro
    /*
    @Process('future-job-type')
    async handleFutureJob(job: Job<any>) {
        this.logger.debug(`[STUB] Processando job ${job.id}`);
    }
    */
}