// src/shared/abstract/base-ai.service.ts

import { Logger } from '@nestjs/common';
import { IAIService, AICompletionOptions, AIServiceResponse } from '../interfaces/ai-service.interface';

export abstract class BaseAIService implements IAIService {
    protected readonly logger: Logger;
    protected defaultModel: string;
    protected defaultOptions: AICompletionOptions;

    constructor(serviceName: string) {
        this.logger = new Logger(serviceName);
    }

    /**
     * Método abstrato que será implementado pelas classes concretas
     * para gerar uma conclusão baseada no prompt fornecido.
     */
    abstract generateCompletion(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<AIServiceResponse>;

    /**
     * Envia um prompt e retorna a resposta como um objeto JSON parseado.
     * Esta implementação padrão chama generateCompletion e depois tenta fazer o parsing do JSON,
     * mas pode ser sobrescrita pelas classes concretas se necessário.
     */
    async generateJsonCompletion<T>(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<AIServiceResponse<T>> {
        try {
            const response = await this.generateCompletion(prompt, options);

            // Tenta encontrar e extrair o JSON da resposta
            const content = this.extractJsonFromText(response.content);

            return {
                ...response,
                content: content as T
            };
        } catch (error) {
            this.logger.error(`Error in generateJsonCompletion: ${error.message}`);
            throw new Error(`Failed to generate JSON completion: ${error.message}`);
        }
    }

    /**
     * Extrai e faz o parsing de JSON a partir de uma string de texto
     */
    protected extractJsonFromText<T>(text: string): T {
        try {
            // Tenta encontrar um objeto JSON na resposta
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in the response');
            }

            const jsonStr = jsonMatch[0];
            return JSON.parse(jsonStr) as T;
        } catch (error) {
            this.logger.error(`Error extracting JSON from text: ${error.message}`);
            throw new Error(`Failed to extract JSON: ${error.message}`);
        }
    }

    /**
     * Método de utilidade para mesclar opções padrão com opções fornecidas
     */
    protected mergeOptions(options?: AICompletionOptions): AICompletionOptions {
        return {
            ...this.defaultOptions,
            ...options
        };
    }
}