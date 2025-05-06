import { FeedbackAnalysisInput } from '../interfaces/feedback-analysis-types.interface';
import { ENDPOINTS } from '../constants/endpoints.constants';

export const generateFeedbackAnalysisPrompt = (data: FeedbackAnalysisInput): string => {
  const {
    weeklyFeedback,
    userProfile,
    historicalData: { measurements, goals, previousRecommendations }
  } = data;

  return `
Analise o feedback semanal do usuário e gere recomendações personalizadas para ajustes no plano de dieta e exercícios.

CONTEXTO DO USUÁRIO:
- Preferências dietéticas: ${userProfile.dietaryPreferences.join(', ')}
- Preferências de treino: ${userProfile.workoutPreferences.join(', ')}
- Preferências de estilo de vida: ${userProfile.lifestylePreferences.join(', ')}
- Condições de saúde: ${userProfile.healthConditions.join(', ')}
- Alergias: ${userProfile.allergies.join(', ')}
- Medicamentos: ${userProfile.medications.join(', ')}

MÉTRICAS ATUAIS:
- Aderência geral: ${weeklyFeedback.overall_adherence}%
- Progresso nos objetivos: ${weeklyFeedback.goal_progress}%
- Nível de energia: ${weeklyFeedback.energy_level}/10
- Qualidade do sono: ${weeklyFeedback.sleep_quality}/10
- Nível de estresse: ${weeklyFeedback.stress_level}/10

DESAFIOS IDENTIFICADOS:
${weeklyFeedback.challenges.map(c => `- ${c}`).join('\n')}

CONQUISTAS:
${weeklyFeedback.achievements.map(a => `- ${a}`).join('\n')}

HISTÓRICO DE MEDIDAS:
${measurements.map(m => `- ${m.date}: ${m.value}${m.unit}`).join('\n')}

OBJETIVOS ATUAIS:
${goals.map(g => `- ${g.goal_type}: ${((g.current_value / g.target_value) * 100).toFixed(1)}%`).join('\n')}

RECOMENDAÇÕES ANTERIORES:
${previousRecommendations.map(r => `
Data: ${r.created_at}
Tipo: ${r.recommendation_type}
Status: ${r.status}
Confiança: ${r.confidence_score}%
`).join('\n')}

ENDPOINTS DISPONÍVEIS:

DIETA:
${Object.entries(ENDPOINTS)
  .filter(([key]) => key.startsWith('DIET_'))
  .map(([key, endpoint]) => `
${key}:
- Path: ${endpoint.path}
- Método: ${endpoint.method}
- Descrição: ${endpoint.description}
- Dados Necessários: ${JSON.stringify(endpoint.requiredData, null, 2)}
`).join('\n')}

TREINO:
${Object.entries(ENDPOINTS)
  .filter(([key]) => key.startsWith('WORKOUT_'))
  .map(([key, endpoint]) => `
${key}:
- Path: ${endpoint.path}
- Método: ${endpoint.method}
- Descrição: ${endpoint.description}
- Dados Necessários: ${JSON.stringify(endpoint.requiredData, null, 2)}
`).join('\n')}

ESTILO DE VIDA:
${Object.entries(ENDPOINTS)
  .filter(([key]) => key.startsWith('LIFESTYLE_'))
  .map(([key, endpoint]) => `
${key}:
- Path: ${endpoint.path}
- Método: ${endpoint.method}
- Descrição: ${endpoint.description}
- Dados Necessários: ${JSON.stringify(endpoint.requiredData, null, 2)}
`).join('\n')}

PLANO:
${Object.entries(ENDPOINTS)
  .filter(([key]) => key.startsWith('PLAN_'))
  .map(([key, endpoint]) => `
${key}:
- Path: ${endpoint.path}
- Método: ${endpoint.method}
- Descrição: ${endpoint.description}
- Dados Necessários: ${JSON.stringify(endpoint.requiredData, null, 2)}
`).join('\n')}

INSTRUÇÕES DE ANÁLISE:

1. AVALIAÇÃO INICIAL:
- Analise a aderência ao plano atual
- Avalie o progresso em relação aos objetivos
- Identifique padrões de comportamento
- Considere o histórico de medidas e recomendações

2. DETERMINAÇÃO DO TIPO DE RECOMENDAÇÃO:
- MAINTAIN_PLAN: Se o usuário está progredindo bem
- MINOR_ADJUSTMENTS: Para pequenas modificações no plano
- SIGNIFICANT_CHANGES: Para mudanças mais substanciais
- COMPLETE_RESTRUCTURE: Para reestruturação completa

3. GERAÇÃO DE RECOMENDAÇÕES:
Para cada tipo de mudança, forneça:
- Ajustes calóricos (se necessário)
- Modificações nos macronutrientes
- Mudanças no timing das refeições
- Recomendações de alimentos
- Ajustes nos treinos
- Mudanças no estilo de vida

4. CÁLCULO DE CONFIANÇA:
Considere:
- Qualidade dos dados disponíveis
- Consistência do histórico
- Complexidade das mudanças sugeridas
- Feedback anterior do usuário

5. AÇÕES ESPECÍFICAS:
Para cada recomendação, especifique:
- Endpoint a ser chamado (use os endpoints listados acima)
- Dados necessários para a operação
- Ordem de implementação
- Dependências entre mudanças

FORMATO DE RESPOSTA:
{
  "recommendationType": "TIPO_DE_RECOMMENDACAO",
  "analysisSummary": "Resumo da análise",
  "keyInsights": ["Insight 1", "Insight 2"],
  "recommendedChanges": {
    "diet_changes": {
      "caloric_adjustment": 0,
      "macro_adjustments": {
        "protein": 0,
        "carbs": 0,
        "fats": 0
      },
      "meal_timing": [],
      "food_recommendations": []
    },
    "workout_changes": {
      "intensity_adjustment": "",
      "frequency_adjustment": "",
      "exercise_recommendations": []
    },
    "lifestyle_changes": []
  },
  "confidenceScore": 0,
  "requiredActions": [
    {
      "endpoint": "ENDPOINT",
      "method": "METHOD",
      "data": {},
      "priority": 1
    }
  ]
}

IMPORTANTE:
- Baseie as recomendações em dados concretos
- Considere o histórico do usuário
- Mantenha as mudanças progressivas
- Priorize a saúde e bem-estar
- Documente o raciocínio para cada recomendação
- Use apenas os endpoints listados acima
- Forneça todos os dados necessários para cada endpoint
`;
}; 