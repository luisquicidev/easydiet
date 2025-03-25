// src/modules/worker/services/worker.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { DietProcessorService } from '../../diet/services/diet-processor.service';

@Processor('diet-generation')
@Injectable()
export class WorkerService implements OnModuleInit {
    private readonly logger = new Logger(WorkerService.name);

    constructor(
        @InjectQueue('diet-generation')
        private readonly dietQueue: Queue,
        private readonly configService: ConfigService,
        private readonly dietProcessorService: DietProcessorService,
    ) {}
    /**
     * Inicializado quando o módulo é carregado
     */
    async onModuleInit() {
        // Iniciar o processamento se estiver no modo worker
        if (this.configService.get<string>('NODE_ENV') === 'worker') {
            this.logger.log('Iniciando serviço de worker no modo worker');
            await this.startWorker();
        }
    }

    /**
     * Processa jobs de cálculo metabólico
     */
    @Process('metabolic-calculation')
    async processMetabolicCalculation(job: Job) {
        this.logger.log(`Processando job de cálculo metabólico: ${job.id}`);

        try {
            const { userId, jobId } = job.data;

            // Atualizar progresso
            await job.progress(10);

            // Chamar o serviço responsável pelo processamento
            // Passando apenas o job para o processamento
            await this.dietProcessorService.processMetabolicCalculation(job);

            this.logger.log(`Job de cálculo metabólico ${job.id} processado com sucesso`);
        } catch (error) {
            this.logger.error(`Erro ao processar job de cálculo metabólico ${job.id}: ${error.message}`, error.stack);
            throw error; // Propagar o erro para o Bull gerenciar as tentativas
        }
    }

    /**
     * Processa jobs de geração de dieta
     */
    @Process('diet-generation')
    async processDietGeneration(job: Job) {
        this.logger.log(`Processando job de geração de dieta: ${job.id}`);

        try {
            const { userId, jobId } = job.data;

            // Atualizar progresso
            await job.progress(10);

            // Chamar o processo apropriado com base na fase
            // Se o DietProcessorService não tem processDietGenerationJob, usamos processMetabolicCalculation
            await this.dietProcessorService.processMetabolicCalculation(job);

            this.logger.log(`Job de geração de dieta ${job.id} processado com sucesso`);
        } catch (error) {
            this.logger.error(`Erro ao processar job de geração de dieta ${job.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Inicia o worker e configura o processamento contínuo
     */
    async startWorker() {
        this.logger.log('Worker service iniciado. Pronto para processar jobs.');

        // Configurar listeners para eventos da fila
        this.setupQueueListeners();

        // Limpar jobs antigos e falhos
        await this.cleanupOldJobs();
    }

    /**
     * Configura listeners para monitorar eventos da fila
     */
    private setupQueueListeners() {
        // Monitorar quando um job começa a ser processado
        this.dietQueue.on('active', (job) => {
            this.logger.log(`Processando job ${job.id} do tipo ${job.name}`);
        });

        // Monitorar jobs concluídos com sucesso
        this.dietQueue.on('completed', (job) => {
            this.logger.log(`Job ${job.id} do tipo ${job.name} concluído com sucesso`);
        });

        // Monitorar jobs que falharam
        this.dietQueue.on('failed', (job, error) => {
            this.logger.error(`Job ${job.id} do tipo ${job.name} falhou com erro: ${error.message}`);
        });

        // Monitorar jobs que serão tentados novamente
        this.dietQueue.on('stalled', (job) => {
            this.logger.warn(`Job ${job.id} do tipo ${job.name} travou e será reiniciado`);
        });

        // Monitorar erros gerais da fila
        this.dietQueue.on('error', (error) => {
            this.logger.error(`Erro na fila: ${error.message}`);
        });
    }

    /**
     * Limpa jobs antigos que já foram concluídos ou falharam
     */
    private async cleanupOldJobs() {
        try {
            // Obter a configuração de limpeza (ou usar valores padrão)
            const cleanupThreshold = this.configService.get<number>('QUEUE_CLEANUP_THRESHOLD_DAYS') || 7;
            const thresholdDate = new Date();
            thresholdDate.setDate(thresholdDate.getDate() - cleanupThreshold);

            // Limpar jobs concluídos mais antigos que o limiar configurado
            const completedCount = await this.dietQueue.clean(cleanupThreshold * 24 * 60 * 60 * 1000, 'completed');
            const failedCount = await this.dietQueue.clean(cleanupThreshold * 24 * 60 * 60 * 1000, 'failed');

            this.logger.log(`Limpeza concluída: ${completedCount} jobs completos e ${failedCount} jobs falhos mais antigos que ${cleanupThreshold} dias`);
        } catch (error) {
            this.logger.error(`Erro ao limpar jobs antigos: ${error.message}`);
        }
    }

    /**
     * Verifica o status atual das filas e retorna estatísticas
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
}