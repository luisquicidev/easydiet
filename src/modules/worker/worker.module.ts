// src/modules/worker/worker.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { WorkerService } from './services/worker.service';

@Module({
    imports: [
        ConfigModule,
        BullModule.registerQueue({
            name: 'diet-generation',
            // Configuração mínima para manter compatibilidade futura
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: false,
            },
        }),
    ],
    providers: [WorkerService],
    exports: [WorkerService],
})
export class WorkerModule {}