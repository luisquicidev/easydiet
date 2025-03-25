// src/shared/interfaces/ai-service.interface.ts

export interface AICompletionOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    timeout?: number;
    model?: string;
}

export interface AIServiceResponse<T = string> {
    content: T;
    rawResponse: any; // Tipo genérico para a resposta bruta da API
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
}

export interface IAIService {
    /**
     * Envia um prompt para o modelo de IA e retorna a resposta em texto.
     * @param prompt O prompt a ser enviado para o modelo de IA
     * @param options Opções adicionais para a requisição
     */
    generateCompletion(prompt: string, options?: AICompletionOptions): Promise<AIServiceResponse>;

    /**
     * Envia um prompt para o modelo de IA e retorna a resposta como um objeto JSON parseado.
     * @param prompt O prompt a ser enviado para o modelo de IA
     * @param options Opções adicionais para a requisição
     */
    generateJsonCompletion<T>(prompt: string, options?: AICompletionOptions): Promise<AIServiceResponse<T>>;
}