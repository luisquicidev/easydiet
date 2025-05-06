import { Injectable } from '@nestjs/common';
import { FeedbackAnalysisAgent, AnalysisResult } from '../interfaces/feedback-analysis-agent.interface';
import { FeedbackAnalysisInput } from '../interfaces/feedback-analysis-types.interface';
import { generateFeedbackAnalysisPrompt } from '../prompts/feedback-analysis.prompt';
import { OpenAIService } from '../../../shared/services/openai.service';
import { RecommendationType } from '../entities/weekly-feedback-analysis.entity';

@Injectable()
export class FeedbackAnalysisAgentService implements FeedbackAnalysisAgent {
  constructor(
    private readonly openAIService: OpenAIService,
  ) {}

  async analyzeFeedback(data: FeedbackAnalysisInput): Promise<AnalysisResult> {
    // Gerar prompt com os dados do usuário
    const prompt = generateFeedbackAnalysisPrompt(data);

    try {
      // Chamar o serviço de IA
      const response = await this.openAIService.analyzeFeedback(prompt);

      // Validar e processar a resposta
      const analysisResult = this.validateAndProcessResponse(response);

      return analysisResult;
    } catch (error) {
      // Log do erro
      console.error('Erro na análise de feedback:', error);

      // Em caso de erro, retornar uma análise básica
      return this.generateFallbackAnalysis(data);
    }
  }

  private validateAndProcessResponse(response: string): AnalysisResult {
    try {
      // Tentar fazer parse da resposta como JSON
      const result = JSON.parse(response);

      // Validar estrutura básica
      if (!this.isValidAnalysisResult(result)) {
        throw new Error('Resposta inválida do serviço de IA');
      }

      return result;
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
      throw new Error('Falha ao processar resposta do serviço de IA');
    }
  }

  private isValidAnalysisResult(result: any): result is AnalysisResult {
    return (
      result &&
      typeof result.recommendationType === 'string' &&
      Object.values(RecommendationType).includes(result.recommendationType) &&
      typeof result.analysisSummary === 'string' &&
      Array.isArray(result.keyInsights) &&
      typeof result.recommendedChanges === 'object' &&
      typeof result.confidenceScore === 'number' &&
      Array.isArray(result.requiredActions)
    );
  }

  private generateFallbackAnalysis(data: FeedbackAnalysisInput): AnalysisResult {
    // Análise básica em caso de falha
    return {
      recommendationType: RecommendationType.MAINTAIN_PLAN,
      analysisSummary: 'Análise básica devido a falha no serviço de IA',
      keyInsights: [
        'Não foi possível realizar uma análise completa',
        'Recomendação: Manter o plano atual até próxima análise'
      ],
      recommendedChanges: {
        diet_changes: {
          caloric_adjustment: 0,
          macro_adjustments: {
            protein: 0,
            carbs: 0,
            fats: 0
          },
          meal_timing: [],
          food_recommendations: []
        },
        workout_changes: {
          intensity_adjustment: 'manter',
          frequency_adjustment: 'manter',
          exercise_recommendations: []
        },
        lifestyle_changes: []
      },
      confidenceScore: 50,
      requiredActions: []
    };
  }

  private calculateConfidenceScore(data: FeedbackAnalysisInput): number {
    // TODO: Implementar cálculo de score de confiança
    return 85;
  }

  private determineRecommendationType(data: FeedbackAnalysisInput): RecommendationType {
    // TODO: Implementar lógica para determinar tipo de recomendação
    return RecommendationType.MINOR_ADJUSTMENTS;
  }

  private generateKeyInsights(data: FeedbackAnalysisInput): string[] {
    // TODO: Implementar geração de insights
    return [];
  }

  private generateRecommendedChanges(data: FeedbackAnalysisInput): AnalysisResult['recommendedChanges'] {
    // TODO: Implementar geração de mudanças recomendadas
    return {
      diet_changes: {
        caloric_adjustment: 0,
        macro_adjustments: {
          protein: 0,
          carbs: 0,
          fats: 0
        },
        meal_timing: [],
        food_recommendations: []
      },
      workout_changes: {
        intensity_adjustment: '',
        frequency_adjustment: '',
        exercise_recommendations: []
      },
      lifestyle_changes: []
    };
  }
} 