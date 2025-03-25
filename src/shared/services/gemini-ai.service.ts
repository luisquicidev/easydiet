// src/shared/services/gemini-ai.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseAIService } from '../abstract/base-ai.service';
import { AICompletionOptions, AIServiceResponse } from '../interfaces/ai-service.interface';

@Injectable()
export class GeminiAIService extends BaseAIService {
    private readonly genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(private configService: ConfigService) {
        super('GeminiAIService');

        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY not found in environment variables');
        }

        // Garantir que apiKey seja uma string
        this.genAI = new GoogleGenerativeAI(apiKey || '');
        this.defaultModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';

        this.defaultOptions = {
            temperature: 0.7,
            maxTokens: 8192,
        };

        this.model = this.genAI.getGenerativeModel({ model: this.defaultModel });
    }

    /**
     * Gera uma resposta usando a API Gemini
     */
    async generateCompletion(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<AIServiceResponse> {
        try {
            this.logger.debug(`Sending prompt to Gemini API: ${prompt.substring(0, 100)}...`);

            const mergedOptions = this.mergeOptions(options);

            // Se um modelo diferente for especificado nas opções, use-o
            // Garantir que model seja sempre uma string
            const modelName = mergedOptions.model || this.defaultModel;
            const model = modelName !== this.defaultModel
                ? this.genAI.getGenerativeModel({ model: modelName })
                : this.model;

            // Configurar os parâmetros da geração
            const generationConfig = {
                temperature: mergedOptions.temperature,
                maxOutputTokens: mergedOptions.maxTokens,
                topP: mergedOptions.topP,
            };

            // Realizar a chamada à API
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
            });

            const response = result.response;
            const content = response.text();

            this.logger.debug(`Received response from Gemini API: ${content.substring(0, 100)}...`);

            return {
                content,
                rawResponse: response,
                // A API do Gemini não fornece informações de uso de tokens da mesma forma que a OpenAI,
                // então deixamos o campo usage como undefined
            };
        } catch (error) {
            this.logger.error(`Error generating content with Gemini API: ${error.message}`);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
}