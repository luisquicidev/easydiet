// src/worker.ts

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { WorkerService } from './modules/worker/services/worker.service';

dotenv.config();

// Definir variável de ambiente para indicar que estamos no modo worker
process.env.NODE_ENV = process.env.NODE_ENV || 'worker';

async function bootstrap() {
    const logger = new Logger('WorkerBootstrap');

    try {
        logger.log('Initializing worker process...');

        // Criar contexto da aplicação com configurações específicas para worker
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        // Obter instância do WorkerService
        const workerService = app.get(WorkerService);

        // Iniciar o processamento (o método onModuleInit será chamado automaticamente)
        logger.log('Worker process initialized successfully');

        // Configurar tratamento de sinais para desligamento gracioso
        process.on('SIGINT', async () => {
            logger.log('Received SIGINT signal. Shutting down worker gracefully...');
            await app.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.log('Received SIGTERM signal. Shutting down worker gracefully...');
            await app.close();
            process.exit(0);
        });

        // Exibir estatísticas da fila a cada 5 minutos
        setInterval(async () => {
            const stats = await workerService.getQueueStats();
            logger.log(`Queue stats: ${JSON.stringify(stats)}`);
        }, 5 * 60 * 1000);

    } catch (error) {
        logger.error(`Failed to start worker process: ${error.message}`);
        process.exit(1);
    }
}

bootstrap();