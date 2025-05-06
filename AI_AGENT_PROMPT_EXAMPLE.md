# Exemplo de Prompt para Análise de Histórico

## Contexto do Usuário
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "goal": "weightLoss",
    "current_weight": 85.5,
    "target_weight": 75.0,
    "start_date": "2024-01-01"
  },
  "biometrics": {
    "height": 175,
    "age": 35,
    "gender": "male",
    "activity_level": 1.55
  }
}
```

## Histórico de Feedback (Últimos 30 dias)
```json
{
  "daily_summaries": [
    {
      "date": "2024-03-01",
      "overall_adherence": 0.85,
      "average_satisfaction": 4.2,
      "average_energy": 7.5,
      "average_mood": "good",
      "key_insights": [
        "Manteve boa aderência ao café da manhã",
        "Dificuldade com jantar após 20h"
      ]
    }
  ],
  "meal_feedback": [
    {
      "date": "2024-03-01",
      "meal": {
        "name": "Café da Manhã",
        "scheduled_time": "08:00",
        "satisfaction_rating": 5,
        "adherence_status": "followed",
        "energy_level": 8,
        "hunger_level": 3,
        "mood": "great",
        "stress_level": 2,
        "motivation_level": 9
      }
    },
    {
      "date": "2024-03-01",
      "meal": {
        "name": "Almoço",
        "scheduled_time": "12:30",
        "satisfaction_rating": 4,
        "adherence_status": "modified",
        "modifications": [
          {
            "original_food": "Arroz Integral",
            "replacement": "Quinoa",
            "quantity_changed": -20,
            "reason": "Preferência pessoal"
          }
        ],
        "energy_level": 7,
        "hunger_level": 4,
        "mood": "good",
        "stress_level": 3,
        "motivation_level": 8
      }
    }
  ],
  "patterns": {
    "adherence_by_meal": {
      "breakfast": 0.95,
      "lunch": 0.85,
      "dinner": 0.65
    },
    "common_modifications": [
      {
        "food": "Arroz Integral",
        "frequency": 0.4,
        "common_replacements": ["Quinoa", "Batata Doce"]
      }
    ],
    "energy_trends": {
      "morning": 7.8,
      "afternoon": 6.5,
      "evening": 5.2
    }
  }
}
```

## Instruções para o Agente

Analise o histórico do usuário e forneça:

1. **Análise de Padrões**
   - Identifique padrões de aderência
   - Analise tendências de energia e humor
   - Detecte alimentos frequentemente modificados

2. **Insights Personalizados**
   - Pontos fortes do usuário
   - Áreas que precisam de atenção
   - Sugestões de melhoria

3. **Recomendações de Ajustes**
   - Modificações no plano alimentar
   - Sugestões de horários
   - Alternativas para alimentos problemáticos

4. **Previsões e Metas**
   - Projeção de progresso
   - Metas realistas
   - Marcos importantes

## Formato de Resposta Esperado
```json
{
  "analysis": {
    "patterns": {
      "strengths": [
        "Excelente aderência ao café da manhã",
        "Bom controle de porções no almoço"
      ],
      "challenges": [
        "Dificuldade com jantares tardios",
        "Substituições frequentes de arroz integral"
      ]
    },
    "insights": [
      "Nível de energia cai significativamente à noite",
      "Maior satisfação com refeições preparadas com antecedência"
    ],
    "recommendations": [
      {
        "type": "meal_timing",
        "suggestion": "Antecipar jantar para 19:00",
        "reason": "Melhor aderência observada em horários anteriores"
      },
      {
        "type": "food_substitution",
        "suggestion": "Incluir mais opções de grãos integrais",
        "reason": "Alta frequência de substituições de arroz"
      }
    ],
    "goals": {
      "short_term": [
        "Aumentar aderência ao jantar para 80%",
        "Manter nível de energia acima de 6 no período noturno"
      ],
      "long_term": [
        "Estabilizar peso em 75kg",
        "Desenvolver hábitos consistentes de preparação de refeições"
      ]
    }
  }
}
```

## Notas Adicionais
- Considere o contexto individual do usuário
- Priorize recomendações práticas e realistas
- Mantenha um tom motivador e positivo
- Inclua explicações claras para cada recomendação
- Considere fatores externos (trabalho, sono, etc.) 