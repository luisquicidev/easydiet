// src/health/health.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HealthController } from './health.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'diet-generation',
        }),
    ],
    controllers: [HealthController],
})
export class HealthModule {}