// src/shared/factories/ai-service.factory.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIService } from '../interfaces/ai-service.interface';
import { GeminiAIService } from '../services/gemini-ai.service';
import { OpenAIService } from '../services/openai-ai.service';
import { AnthropicAIService } from '../services/anthropic-ai.service';

export enum AIProvider {
    GEMINI = 'gemini',
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
}

@Injectable()
export class AIServiceFactory {
    private readonly logger = new Logger(AIServiceFactory.name);
    private readonly providers: Map<AIProvider, IAIService>;
    private readonly defaultProvider: AIProvider;
    private readonly fallbackOrder: AIProvider[];

    constructor(
        private configService: ConfigService,
        private geminiService: GeminiAIService,
        private openaiService: OpenAIService,
        private anthropicService: AnthropicAIService,
    ) {
        this.providers = new Map();
        this.providers.set(AIProvider.GEMINI, geminiService);
        this.providers.set(AIProvider.OPENAI, openaiService);
        this.providers.set(AIProvider.ANTHROPIC, anthropicService);

        // Define o provedor padrão com base na configuração
        this.defaultProvider = this.getDefaultProvider();

        // Define a ordem de fallback para caso o provedor principal falhe
        this.fallbackOrder = this.getFallbackOrder();
    }

    /**
     * Retorna o serviço de IA conforme o provedor especificado ou o padrão
     */
    getService(provider?: AIProvider): IAIService {
        if (provider && this.providers.has(provider)) {
            return <IAIService>this.providers.get(provider);
        }

        this.logger.log(`Using default AI provider: ${this.defaultProvider}`);
        return <IAIService>this.providers.get(this.defaultProvider);
    }

    /**
     * Retorna o serviço de IA primário com capacidade de fallback para outros provedores
     */
    getServiceWithFallback(): IAIService {
        // Aqui poderíamos implementar um proxy para o serviço que tentaria
        // automaticamente os provedores de fallback em caso de falha
        // Por enquanto, apenas retornamos o serviço padrão
        return this.getService();
    }

    /**
     * Determina o provedor padrão com base na configuração
     */
    private getDefaultProvider(): AIProvider {
        const configProvider = this.configService.get<string>('AI_PROVIDER');

        if (configProvider) {
            const provider = configProvider.toLowerCase() as AIProvider;
            if (Object.values(AIProvider).includes(provider)) {
                return provider;
            }
        }

        // Se não houver configuração específica, verifica quais chaves de API estão disponíveis
        if (this.configService.get<string>('GEMINI_API_KEY')) {
            return AIProvider.GEMINI;
        } else if (this.configService.get<string>('OPENAI_API_KEY')) {
            return AIProvider.OPENAI;
        } else if (this.configService.get<string>('ANTHROPIC_API_KEY')) {
            return AIProvider.ANTHROPIC;
        }

        // Se nenhuma chave estiver configurada, usa Gemini como padrão
        this.logger.warn('No AI provider API keys found in configuration. Using Gemini as default.');
        return AIProvider.GEMINI;
    }

    /**
     * Determina a ordem de fallback dos provedores
     */
    private getFallbackOrder(): AIProvider[] {
        const configFallbackOrder = this.configService.get<string>('AI_FALLBACK_ORDER');

        if (configFallbackOrder) {
            const fallbackProviders = configFallbackOrder
                .split(',')
                .map(p => p.trim().toLowerCase() as AIProvider)
                .filter(p => Object.values(AIProvider).includes(p));

            if (fallbackProviders.length > 0) {
                return fallbackProviders;
            }
        }

        // Ordem padrão de fallback se não for especificada na configuração
        return [AIProvider.GEMINI, AIProvider.OPENAI, AIProvider.ANTHROPIC];
    }
}