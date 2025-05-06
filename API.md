# Documentação da API EasyDiet

## Autenticação

### POST /auth/login
Autentica um usuário e retorna tokens de acesso.

**Request Body:**
```json
{
    "email": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "access_token": "string",
    "refresh_token": "string"
}
```

### POST /auth/refresh
Atualiza o token de acesso usando o refresh token.

**Request Body:**
```json
{
    "userId": "number",
    "refreshToken": "string"
}
```

### POST /auth/logout
Realiza o logout do usuário.

**Headers:**
- Authorization: Bearer {token}

## Usuários

### POST /users/register
Registra um novo usuário.

**Request Body:**
```json
{
    "email": "string",
    "password": "string",
    "name": "string"
}
```

### PUT /users/password
Atualiza a senha do usuário.

**Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
    "currentPassword": "string",
    "newPassword": "string"
}
```

## Nutrição

### GET /nutrition/biometrics
Obtém os dados biométricos do usuário.

**Headers:**
- Authorization: Bearer {token}

### POST /nutrition/biometrics
Cria/atualiza os dados biométricos do usuário.

**Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
    "weight": "number",
    "height": "number",
    "age": "number",
    "gender": "string"
}
```

### GET /nutrition/activities
Obtém as atividades físicas do usuário.

**Headers:**
- Authorization: Bearer {token}

### POST /nutrition/activities
Adiciona uma nova atividade física.

**Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
    "type": "string",
    "frequency": "number",
    "duration": "number",
    "intensity": "string"
}
```

### GET /nutrition/goals
Obtém os objetivos nutricionais do usuário.

**Headers:**
- Authorization: Bearer {token}

### POST /nutrition/goals
Define os objetivos nutricionais do usuário.

**Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
    "goalType": "string",
    "targetWeight": "number",
    "calorieAdjustment": "number"
}
```

### GET /nutrition/preferences
Obtém as preferências alimentares do usuário.

**Headers:**
- Authorization: Bearer {token}

### POST /nutrition/preferences
Adiciona uma nova preferência alimentar.

**Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
    "type": "string",
    "description": "string",
    "calories": "number",
    "carbohydrates": "number",
    "proteins": "number",
    "fats": "number"
}
```

### PUT /nutrition/preferences/:id
Atualiza uma preferência alimentar existente.

**Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
    "type": "string",
    "description": "string",
    "calories": "number",
    "carbohydrates": "number",
    "proteins": "number",
    "fats": "number"
}
```

## Dieta

### POST /diet/calculate-metabolism
Calcula o metabolismo do usuário e gera planos calóricos.

**Headers:**
- Authorization: Bearer {token}

**Response:**
```json
{
    "success": "boolean",
    "message": "string",
    "jobId": "string",
    "calculationId": "string",
    "plans": [
        {
            "id": "string",
            "name": "string",
            "totalCalories": "number",
            "macronutrients": {
                "protein": "number",
                "carbs": "number",
                "fat": "number"
            },
            "application": "string"
        }
    ]
}
```

### POST /diet/plan-meals
Planeja as refeições do usuário.

**Headers:**
- Authorization: Bearer {token}

### GET /diet/calculation/:calculationId
Obtém o resultado de um cálculo metabólico específico.

**Headers:**
- Authorization: Bearer {token}

### GET /diet/plans
Obtém todos os planos de dieta do usuário.

**Headers:**
- Authorization: Bearer {token}

### GET /diet/plans/:planId
Obtém um plano de dieta específico com suas refeições.

**Headers:**
- Authorization: Bearer {token}

### GET /diet/jobs/:jobId
Obtém o status de um job específico.

**Headers:**
- Authorization: Bearer {token}

## Feedback de Refeições
Base URL: `/feedback/meals`

### Criar Feedback de Refeição
```http
POST /feedback/meals
```
**Body:**
```json
{
  "meal_id": "uuid",
  "date": "2024-03-20",
  "satisfaction_rating": 8,
  "energy_level": 7,
  "hunger_level": 6,
  "mood": "good",
  "comments": "Comentários sobre a refeição",
  "foods": [
    {
      "diet_meal_food_id": "uuid",
      "consumed": true,
      "quantity": 100,
      "unit": "g",
      "notes": "Observações sobre o alimento"
    }
  ],
  "modifications": [
    {
      "type": "substitution",
      "original_food_id": "uuid",
      "replacement_food_id": "uuid",
      "reason": "Motivo da substituição"
    }
  ]
}
```

### Listar Feedbacks
```http
GET /feedback/meals
```
**Query Params:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

### Buscar Feedback Específico
```http
GET /feedback/meals/:id
```

### Atualizar Feedback
```http
PATCH /feedback/meals/:id
```
**Body:** Mesmo formato do POST

### Remover Feedback
```http
DELETE /feedback/meals/:id
```

## Feedback Diário
Base URL: `/feedback/daily`

### Criar Resumo Diário
```http
POST /feedback/daily
```
**Body:**
```json
{
  "date": "2024-03-20",
  "overall_adherence": 85,
  "energy_level": 7,
  "sleep_quality": 8,
  "stress_level": 4,
  "challenges": ["Desafio 1", "Desafio 2"],
  "achievements": ["Conquista 1", "Conquista 2"],
  "notes": "Observações gerais do dia"
}
```

### Listar Resumos Diários
```http
GET /feedback/daily
```
**Query Params:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

### Gerar Resumo Automático
```http
POST /feedback/daily/generate
```
**Query Params:**
- `date`: Data para gerar resumo (YYYY-MM-DD)

## Feedback Semanal
Base URL: `/feedback/weekly`

### Criar Feedback Semanal
```http
POST /feedback/weekly
```
**Body:**
```json
{
  "week_start_date": "2024-03-18",
  "overall_adherence": 82,
  "goal_progress": 75,
  "energy_level": 7.5,
  "sleep_quality": 8.2,
  "stress_level": 4.5,
  "challenges": ["Desafio 1", "Desafio 2"],
  "achievements": ["Conquista 1", "Conquista 2"],
  "notes": "Observações da semana"
}
```

### Listar Feedbacks Semanais
```http
GET /feedback/weekly
```
**Query Params:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

## Análise de Feedback
Base URL: `/feedback/weekly/analysis`

### Analisar Feedback Semanal
```http
POST /feedback/weekly/analysis/:id/analyze
```
**Response:**
```json
{
  "id": "uuid",
  "weekly_feedback_id": "uuid",
  "user_id": "uuid",
  "recommendation_type": "MAINTAIN_PLAN | MINOR_ADJUSTMENTS | SIGNIFICANT_CHANGES | COMPLETE_RESTRUCTURE",
  "analysis_summary": "Resumo detalhado da análise",
  "key_insights": [
    "Insight 1 sobre padrões identificados",
    "Insight 2 sobre progresso",
    "Insight 3 sobre desafios"
  ],
  "recommended_changes": {
    "diet_changes": {
      "caloric_adjustment": 0,
      "macro_adjustments": {
        "protein": 0,
        "carbs": 0,
        "fats": 0
      },
      "meal_timing": [
        {
          "meal": "breakfast",
          "recommendation": "Ajuste sugerido"
        }
      ],
      "food_recommendations": [
        {
          "food": "Nome do alimento",
          "reason": "Motivo da recomendação"
        }
      ]
    },
    "workout_changes": {
      "intensity_adjustment": "AUMENTAR | MANTER | DIMINUIR",
      "frequency_adjustment": "AUMENTAR | MANTER | DIMINUIR",
      "exercise_recommendations": [
        {
          "exercise": "Nome do exercício",
          "reason": "Motivo da recomendação"
        }
      ]
    },
    "lifestyle_changes": [
      {
        "type": "SLEEP | STRESS | HYDRATION",
        "recommendation": "Recomendação específica"
      }
    ]
  },
  "confidence_score": 85,
  "required_actions": [
    {
      "endpoint": "ENDPOINT_NAME",
      "method": "POST | PATCH",
      "data": {},
      "priority": 1
    }
  ],
  "created_at": "2024-03-20T10:00:00Z",
  "status": "PENDING | IMPLEMENTED | REJECTED"
}
```

### Listar Análises
```http
GET /feedback/weekly/analysis
```
**Query Params:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

### Atualizar Status da Análise
```http
PATCH /feedback/weekly/analysis/:id/status
```
**Body:**
```json
{
  "status": "IMPLEMENTED"
}
```

### Implementar Recomendação
```http
POST /feedback/weekly/analysis/:id/implement
```
**Body:**
```json
{
  "implementation_notes": "Notas sobre a implementação",
  "feedback": "Feedback sobre a implementação"
}
```

## Padrões de Feedback
Base URL: `/feedback/patterns`

### Criar Padrão
```http
POST /feedback/patterns
```
**Body:**
```json
{
  "pattern_type": "DIET",
  "description": "Descrição do padrão",
  "frequency": 0.75,
  "impact": "HIGH",
  "recommendations": ["Recomendação 1", "Recomendação 2"]
}
```

### Listar Padrões
```http
GET /feedback/patterns
```

### Analisar Padrões
```http
POST /feedback/patterns/analyze
```
**Query Params:**
- `days`: Número de dias para análise

## Códigos de Status
- `200`: Sucesso
- `201`: Criado
- `400`: Requisição inválida
- `401`: Não autorizado
- `404`: Não encontrado
- `500`: Erro interno

## Observações
1. Todos os endpoints (exceto login e registro) requerem autenticação via token JWT.
2. O token deve ser enviado no header `Authorization` no formato `Bearer {token}`.
3. As respostas de erro seguem o formato padrão do NestJS.
4. Todos os endpoints retornam respostas em formato JSON.
5. Todas as datas devem estar no formato ISO 8601 (YYYY-MM-DD)
6. IDs são UUIDs
7. Valores numéricos devem estar dentro dos limites especificados
8. Enums devem usar os valores exatos definidos