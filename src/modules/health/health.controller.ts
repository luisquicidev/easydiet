// src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller('health')
export class HealthController {
    constructor(
        @InjectConnection()
        private connection: Connection,
        @InjectQueue('diet-generation')
        private readonly dietQueue: Queue,
    ) {}

    @Get()
    async check() {
        // Verificar conexão com banco de dados
        const dbStatus = await this.checkDatabaseConnection();

        // Verificar conexão com Redis/Bull
        const redisStatus = await this.checkRedisConnection();

        const isHealthy = dbStatus.isHealthy && redisStatus.isHealthy;

        return {
            status: isHealthy ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                queue: redisStatus,
            },
        };
    }

    private async checkDatabaseConnection() {
        try {
            // Tenta executar uma query simples para verificar a conexão
            await this.connection.query('SELECT 1');
            return { isHealthy: true };
        } catch (error) {
            return {
                isHealthy: false,
                error: error.message
            };
        }
    }

    private async checkRedisConnection() {
        try {
            // Verifica o status da conexão do Bull com Redis
            const client = await this.dietQueue.client;
            // Ping para verificar se está respondendo
            await client.ping();
            return { isHealthy: true };
        } catch (error) {
            return {
                isHealthy: false,
                error: error.message
            };
        }
    }
}