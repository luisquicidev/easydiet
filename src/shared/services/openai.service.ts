import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async analyzeFeedback(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de feedback de dieta e exercícios. Sua tarefa é analisar o feedback do usuário e gerar recomendações personalizadas para ajustes no plano. Responda APENAS com o JSON no formato especificado, sem texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia da API OpenAI');
      }

      return content;
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      throw new Error('Falha ao analisar feedback com IA');
    }
  }
} 