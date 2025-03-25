// src/shared/services/anthropic-ai.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { BaseAIService } from '../abstract/base-ai.service';
import { AICompletionOptions, AIServiceResponse } from '../interfaces/ai-service.interface';

@Injectable()
export class AnthropicAIService extends BaseAIService {
    private readonly anthropic: Anthropic;

    constructor(private configService: ConfigService) {
        super('AnthropicAIService');

        const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
        if (!apiKey) {
            this.logger.error('ANTHROPIC_API_KEY not found in environment variables');
        }

        this.anthropic = new Anthropic({
            apiKey: apiKey || '',
        });

        this.defaultModel = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-opus-20240229';

        this.defaultOptions = {
            temperature: 0.7,
            maxTokens: 4096,
        };
    }

    /**
     * Gera uma resposta usando a API do Anthropic Claude
     */
    async generateCompletion(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<AIServiceResponse> {
        try {
            this.logger.debug(`Sending prompt to Anthropic API: ${prompt.substring(0, 100)}...`);

            const mergedOptions = this.mergeOptions(options);

            // Garantir que max_tokens seja sempre um número
            const maxTokens = mergedOptions.maxTokens ?? 4096;

            const response = await this.anthropic.messages.create({
                model: mergedOptions.model || this.defaultModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: mergedOptions.temperature,
                max_tokens: maxTokens,
                system: 'You are a helpful assistant specialized in nutrition and diet planning. Always provide responses in valid JSON format when requested.',
            });

            // Extrair texto da resposta com type guard
            let content = '';

            if (response.content && response.content.length > 0) {
                const block = response.content[0];

                // Usar type assertion para acessar a propriedade text de forma segura
                if (block.type === 'text') {
                    content = (block as any).text;
                } else {
                    // Fallback para caso o formato da resposta mude
                    this.logger.warn(`Unexpected content block type: ${block.type}`);
                    content = JSON.stringify(block);
                }
            }

            this.logger.debug(`Received response from Anthropic API: ${content.substring(0, 100)}...`);

            return {
                content,
                rawResponse: response,
                usage: {
                    // A API do Anthropic pode não fornecer estas informações da mesma forma que a OpenAI
                    // ou estas podem precisar ser adaptadas conforme a documentação atual da API
                },
            };
        } catch (error) {
            this.logger.error(`Error generating content with Anthropic API: ${error.message}`);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
}