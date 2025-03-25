// src/modules/worker/worker.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './services/worker.service';
import { DietModule } from '../diet/diet.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { AIModule } from '../../shared/ai/ai.module';

@Module({
    imports: [
        ConfigModule,
        BullModule.registerQueue({
            name: 'diet-generation',
            // Opções específicas para a fila diet-generation (worker)
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                timeout: 120000, // 2 minutos
                removeOnComplete: 50,
                removeOnFail: 100,
            },
        }),
        // Importamos os módulos necessários para processar os jobs
        DietModule,
        NutritionModule,
        AIModule,
    ],
    providers: [WorkerService],
    exports: [WorkerService],
})
export class WorkerModule {}