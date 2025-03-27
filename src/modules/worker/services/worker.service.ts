// src/modules/worker/services/worker.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerService implements OnModuleInit {
    private readonly logger = new Logger(WorkerService.name);

    constructor(
        @InjectQueue('diet-generation')
        private readonly dietQueue: Queue,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Inicializado quando o módulo é carregado
     */
    async onModuleInit() {
        // Verificar se estamos no modo worker
        if (this.configService.get<string>('NODE_ENV') === 'worker') {
            this.logger.log('Iniciando serviço de worker no modo worker');
            await this.startWorker();
        }
    }

    /**
     * Inicializa o worker básico
     * Essa é uma versão simplificada que pode ser expandida no futuro
     */
    async startWorker() {
        this.logger.log('Worker service iniciado. Estrutura básica pronta para implementação futura.');
        this.setupQueueListeners();
    }

    /**
     * Configura listeners básicos para monitorar eventos da fila
     */
    private setupQueueListeners() {
        // Monitorar eventos básicos da fila
        this.dietQueue.on('error', (error) => {
            this.logger.error(`Erro na fila: ${error.message}`);
        });
    }

    /**
     * Verifica o status atual das filas e retorna estatísticas
     * Método mantido para diagnóstico
     */
    async getQueueStats() {
        const [
            activeCount,
            waitingCount,
            completedCount,
            failedCount,
            delayedCount
        ] = await Promise.all([
            this.dietQueue.getActiveCount(),
            this.dietQueue.getWaitingCount(),
            this.dietQueue.getCompletedCount(),
            this.dietQueue.getFailedCount(),
            this.dietQueue.getDelayedCount()
        ]);

        return {
            active: activeCount,
            waiting: waitingCount,
            completed: completedCount,
            failed: failedCount,
            delayed: delayedCount
        };
    }

    // Métodos stub para implementação futura de processamento
    async processDietJob(jobId: string): Promise<void> {
        this.logger.debug(`[STUB] Processamento de job ${jobId} - Implementação futura`);
    }
}