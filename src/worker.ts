// src/worker.ts

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

dotenv.config();

// Definir variável de ambiente para indicar que estamos no modo worker
process.env.NODE_ENV = process.env.NODE_ENV || 'worker';

async function bootstrap() {
    const logger = new Logger('WorkerBootstrap');

    try {
        logger.log('Inicializando processo worker (modo stub)...');

        // Criar contexto da aplicação
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        logger.log('Processo worker inicializado com estrutura básica');

        // Configurar tratamento de sinais para desligamento gracioso
        process.on('SIGINT', async () => {
            logger.log('Recebido sinal SIGINT. Encerrando worker...');
            await app.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.log('Recebido sinal SIGTERM. Encerrando worker...');
            await app.close();
            process.exit(0);
        });

    } catch (error) {
        logger.error(`Falha ao iniciar processo worker: ${error.message}`);
        process.exit(1);
    }
}

bootstrap();