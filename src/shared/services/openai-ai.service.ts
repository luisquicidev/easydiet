// src/shared/services/openai-ai.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BaseAIService } from '../abstract/base-ai.service';
import { AICompletionOptions, AIServiceResponse } from '../interfaces/ai-service.interface';

@Injectable()
export class OpenAIService extends BaseAIService {
    private readonly openai: OpenAI;

    constructor(private configService: ConfigService) {
        super('OpenAIService');

        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.error('OPENAI_API_KEY not found in environment variables');
        }

        this.openai = new OpenAI({
            apiKey: apiKey || '',
        });

        this.defaultModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4-turbo';

        this.defaultOptions = {
            temperature: 0.7,
            maxTokens: 4096,
            topP: 1,
        };
    }

    /**
     * Gera uma resposta usando a API da OpenAI
     */
    async generateCompletion(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<AIServiceResponse> {
        try {
            this.logger.debug(`Sending prompt to OpenAI API: ${prompt.substring(0, 100)}...`);

            const mergedOptions = this.mergeOptions(options);

            // Garantir que model seja sempre uma string
            const modelName = mergedOptions.model || this.defaultModel;

            const response = await this.openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant specialized in nutrition and diet planning.' },
                    { role: 'user', content: prompt }
                ],
                temperature: mergedOptions.temperature,
                max_tokens: mergedOptions.maxTokens,
                top_p: mergedOptions.topP,
            });

            const content = response.choices[0]?.message?.content || '';

            this.logger.debug(`Received response from OpenAI API: ${content.substring(0, 100)}...`);

            return {
                content,
                rawResponse: response,
                usage: {
                    promptTokens: response.usage?.prompt_tokens,
                    completionTokens: response.usage?.completion_tokens,
                    totalTokens: response.usage?.total_tokens,
                },
            };
        } catch (error) {
            this.logger.error(`Error generating content with OpenAI API: ${error.message}`);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
}