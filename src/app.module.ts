// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { DietModule } from './modules/diet/diet.module';
import { WorkerModule } from './modules/worker/worker.module';
import { CacheModule } from "@nestjs/cache-manager";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';

@Module({
    imports: [
        // Carregamento das variáveis de ambiente
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        // Configuração do TypeORM para PostgreSQL
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST') || 'postgres',
                port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
                username: configService.get<string>('DB_USER') || 'user',
                password: configService.get<string>('DB_PASSWORD') || 'password',
                database: configService.get<string>('DB_NAME') || 'easydiet',
                autoLoadEntities: true,
                synchronize: configService.get<string>('NODE_ENV') === 'production' ? false : true,
                logging: configService.get<string>('DB_LOGGING') === 'true',
                ssl: configService.get<string>('DB_SSL') === 'true' ? {
                    rejectUnauthorized: false
                } : undefined,
            }),
        }),

        // Configuração global do Bull com Redis
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST') || 'redis',
                    port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
                    password: configService.get<string>('REDIS_PASSWORD'),
                    tls: configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 200,
                },
                // Define o número de jobs a serem processados em paralelo
                limiter: {
                    max: parseInt(configService.get<string>('QUEUE_CONCURRENCY') || '2', 10),
                    duration: 1000,
                },
            }),
        }),

        // Configuração do Cache com Redis
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                store: require('cache-manager-redis-store'),
                host: configService.get<string>('REDIS_HOST') || 'redis',
                port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
                password: configService.get<string>('REDIS_PASSWORD'),
                ttl: 600,
                tls: configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
            }),
        }),

        // Health check module
        HealthModule,

        // Importação dos módulos de funcionalidades
        NutritionModule,
        DietModule,
        WorkerModule,
        UsersModule,
        AuthModule
    ],
})
export class AppModule {}