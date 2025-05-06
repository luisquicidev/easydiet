# Documentação da API

## Autenticação

### Login
- **POST** `/auth/login`
- **Descrição**: Autentica um usuário e retorna um token JWT
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Resposta**:
  ```json
  {
    "access_token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string"
    }
  }
  ```

### Registro
- **POST** `/auth/register`
- **Descrição**: Registra um novo usuário
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "name": "string"
  }
  ```
- **Resposta**:
  ```json
  {
    "id": "string",
    "email": "string",
    "name": "string"
  }
  ```

## Usuários

### Perfil
- **GET** `/users/profile`
- **Descrição**: Retorna o perfil do usuário autenticado
- **Resposta**:
  ```json
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "created_at": "date",
    "updated_at": "date"
  }
  ```

### Atualizar Perfil
- **PATCH** `/users/profile`
- **Descrição**: Atualiza o perfil do usuário autenticado
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```
- **Resposta**:
  ```json
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "updated_at": "date"
  }
  ```

## Dietas

### Criar Dieta
- **POST** `/diet`
- **Descrição**: Cria uma nova dieta para o usuário
- **Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "start_date": "date",
    "end_date": "date",
    "meals": [
      {
        "name": "string",
        "time": "time",
        "foods": [
          {
            "food_id": "string",
            "quantity": "number",
            "unit": "string"
          }
        ]
      }
    ]
  }
  ```
- **Resposta**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "start_date": "date",
    "end_date": "date",
    "created_at": "date",
    "updated_at": "date",
    "meals": [
      {
        "id": "string",
        "name": "string",
        "time": "time",
        "foods": [
          {
            "id": "string",
            "food_id": "string",
            "quantity": "number",
            "unit": "string"
          }
        ]
      }
    ]
  }
  ```

### Listar Dietas
- **GET** `/diet`
- **Descrição**: Lista todas as dietas do usuário
- **Resposta**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "start_date": "date",
      "end_date": "date",
      "created_at": "date",
      "updated_at": "date"
    }
  ]
  ```

### Buscar Dieta
- **GET** `/diet/:id`
- **Descrição**: Retorna uma dieta específica
- **Resposta**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "start_date": "date",
    "end_date": "date",
    "created_at": "date",
    "updated_at": "date",
    "meals": [
      {
        "id": "string",
        "name": "string",
        "time": "time",
        "foods": [
          {
            "id": "string",
            "food_id": "string",
            "quantity": "number",
            "unit": "string"
          }
        ]
      }
    ]
  }
  ```

### Atualizar Dieta
- **PATCH** `/diet/:id`
- **Descrição**: Atualiza uma dieta existente
- **Body**: Mesmo formato do POST
- **Resposta**: Mesmo formato do GET

### Remover Dieta
- **DELETE** `/diet/:id`
- **Descrição**: Remove uma dieta
- **Resposta**: Status 204 (No Content)

## Feedback

### Feedback de Refeições

#### Criar Feedback
- **POST** `/feedback/meals`
- **Descrição**: Registra feedback de uma refeição
- **Body**:
  ```json
  {
    "user_id": "string",
    "meal_id": "string",
    "date": "date",
    "satisfaction_rating": "number",
    "energy_level": "number",
    "hunger_level": "number",
    "mood": "string",
    "foods": [
      {
        "food_id": "string",
        "quantity": "number",
        "unit": "string",
        "was_consumed": "boolean",
        "consumption_percentage": "number",
        "notes": "string"
      }
    ],
    "modifications": [
      {
        "original_food_id": "string",
        "modification_type": "string",
        "reason": "string",
        "replacement_food_id": "string",
        "quantity": "number",
        "unit": "string"
      }
    ],
    "notes": "string"
  }
  ```
- **Resposta**:
  ```json
  {
    "id": "string",
    "user_id": "string",
    "meal_id": "string",
    "date": "date",
    "satisfaction_rating": "number",
    "energy_level": "number",
    "hunger_level": "number",
    "mood": "string",
    "foods": [
      {
        "id": "string",
        "food_id": "string",
        "quantity": "number",
        "unit": "string",
        "was_consumed": "boolean",
        "consumption_percentage": "number",
        "notes": "string"
      }
    ],
    "modifications": [
      {
        "id": "string",
        "original_food_id": "string",
        "modification_type": "string",
        "reason": "string",
        "replacement_food_id": "string",
        "quantity": "number",
        "unit": "string"
      }
    ],
    "notes": "string",
    "created_at": "date",
    "updated_at": "date"
  }
  ```

#### Listar Feedbacks
- **GET** `/feedback/meals`
- **Descrição**: Lista todos os feedbacks de refeições
- **Query Params**:
  - `startDate`: Data inicial (opcional)
  - `endDate`: Data final (opcional)
- **Resposta**:
  ```json
  [
    {
      "id": "string",
      "user_id": "string",
      "meal_id": "string",
      "date": "date",
      "satisfaction_rating": "number",
      "energy_level": "number",
      "hunger_level": "number",
      "mood": "string",
      "foods": [...],
      "modifications": [...],
      "notes": "string",
      "created_at": "date",
      "updated_at": "date"
    }
  ]
  ```

#### Buscar Feedback
- **GET** `/feedback/meals/:id`
- **Descrição**: Retorna um feedback específico
- **Resposta**: Mesmo formato do POST

#### Atualizar Feedback
- **PATCH** `/feedback/meals/:id`
- **Descrição**: Atualiza um feedback existente
- **Body**: Mesmo formato do POST
- **Resposta**: Mesmo formato do POST

#### Remover Feedback
- **DELETE** `/feedback/meals/:id`
- **Descrição**: Remove um feedback
- **Resposta**: Status 204 (No Content)

### Feedback Diário

#### Criar Resumo Diário
- **POST** `/feedback/daily`
- **Descrição**: Cria um resumo diário de feedback
- **Body**:
  ```json
  {
    "user_id": "string",
    "date": "date",
    "overall_adherence": "number",
    "average_satisfaction": "number",
    "average_energy": "number",
    "average_hunger": "number",
    "dominant_mood": "string",
    "total_meals_consumed": "number",
    "total_meals_planned": "number",
    "total_modifications": "number",
    "notes": "string"
  }
  ```
- **Resposta**:
  ```json
  {
    "id": "string",
    "user_id": "string",
    "date": "date",
    "overall_adherence": "number",
    "average_satisfaction": "number",
    "average_energy": "number",
    "average_hunger": "number",
    "dominant_mood": "string",
    "total_meals_consumed": "number",
    "total_meals_planned": "number",
    "total_modifications": "number",
    "notes": "string",
    "created_at": "date",
    "updated_at": "date"
  }
  ```

#### Listar Resumos Diários
- **GET** `/feedback/daily`
- **Descrição**: Lista todos os resumos diários
- **Query Params**:
  - `startDate`: Data inicial (opcional)
  - `endDate`: Data final (opcional)
- **Resposta**:
  ```json
  [
    {
      "id": "string",
      "user_id": "string",
      "date": "date",
      "overall_adherence": "number",
      "average_satisfaction": "number",
      "average_energy": "number",
      "average_hunger": "number",
      "dominant_mood": "string",
      "total_meals_consumed": "number",
      "total_meals_planned": "number",
      "total_modifications": "number",
      "notes": "string",
      "created_at": "date",
      "updated_at": "date"
    }
  ]
  ```

#### Buscar Resumo Diário
- **GET** `/feedback/daily/:id`
- **Descrição**: Retorna um resumo diário específico
- **Resposta**: Mesmo formato do POST

#### Atualizar Resumo Diário
- **PATCH** `/feedback/daily/:id`
- **Descrição**: Atualiza um resumo diário existente
- **Body**: Mesmo formato do POST
- **Resposta**: Mesmo formato do POST

#### Remover Resumo Diário
- **DELETE** `/feedback/daily/:id`
- **Descrição**: Remove um resumo diário
- **Resposta**: Status 204 (No Content)

#### Gerar Resumo Diário
- **POST** `/feedback/daily/generate`
- **Descrição**: Gera um resumo diário automaticamente
- **Query Params**:
  - `date`: Data para gerar o resumo
- **Resposta**: Mesmo formato do POST

### Padrões de Feedback

#### Criar Padrão
- **POST** `/feedback/patterns`
- **Descrição**: Cria um novo padrão de feedback
- **Body**:
  ```json
  {
    "user_id": "string",
    "pattern_type": "string",
    "pattern_data": "object",
    "confidence_score": "number",
    "is_active": "boolean",
    "last_updated": "date"
  }
  ```
- **Resposta**:
  ```json
  {
    "id": "string",
    "user_id": "string",
    "pattern_type": "string",
    "pattern_data": "object",
    "confidence_score": "number",
    "is_active": "boolean",
    "last_updated": "date",
    "created_at": "date",
    "updated_at": "date"
  }
  ```

#### Listar Padrões
- **GET** `/feedback/patterns`
- **Descrição**: Lista todos os padrões de feedback
- **Resposta**:
  ```json
  [
    {
      "id": "string",
      "user_id": "string",
      "pattern_type": "string",
      "pattern_data": "object",
      "confidence_score": "number",
      "is_active": "boolean",
      "last_updated": "date",
      "created_at": "date",
      "updated_at": "date"
    }
  ]
  ```

#### Buscar Padrão
- **GET** `/feedback/patterns/:id`
- **Descrição**: Retorna um padrão específico
- **Resposta**: Mesmo formato do POST

#### Atualizar Padrão
- **PATCH** `/feedback/patterns/:id`
- **Descrição**: Atualiza um padrão existente
- **Body**: Mesmo formato do POST
- **Resposta**: Mesmo formato do POST

#### Remover Padrão
- **DELETE** `/feedback/patterns/:id`
- **Descrição**: Remove um padrão
- **Resposta**: Status 204 (No Content)

#### Analisar Padrões
- **POST** `/feedback/patterns/analyze`
- **Descrição**: Analisa padrões de feedback em um período
- **Query Params**:
  - `days`: Número de dias para análise (opcional, padrão: 30)
- **Resposta**:
  ```json
  [
    {
      "id": "string",
      "user_id": "string",
      "pattern_type": "string",
      "pattern_data": "object",
      "confidence_score": "number",
      "is_active": "boolean",
      "last_updated": "date",
      "created_at": "date",
      "updated_at": "date"
    }
  ]
  ```

### Análise de Feedback Semanal

#### Gerar Análise
- **POST** `/feedback/weekly/:id/analyze`
- **Descrição**: Gera uma análise do feedback semanal usando IA
- **Resposta**:
  ```json
  {
    "id": "string",
    "weekly_feedback_id": "string",
    "user_id": "string",
    "recommendation_type": "string",
    "status": "string",
    "analysis_summary": "string",
    "key_insights": ["string"],
    "recommended_changes": {
      "diet_changes": {
        "caloric_adjustment": "number",
        "macro_adjustments": {
          "protein": "number",
          "carbs": "number",
          "fats": "number"
        },
        "meal_timing": ["string"],
        "food_recommendations": ["string"]
      },
      "workout_changes": {
        "intensity_adjustment": "string",
        "frequency_adjustment": "string",
        "exercise_recommendations": ["string"]
      },
      "lifestyle_changes": ["string"]
    },
    "confidence_score": "number",
    "implementation_notes": "string",
    "created_at": "date",
    "updated_at": "date"
  }
  ```

#### Listar Análises
- **GET** `/feedback/weekly/analysis`
- **Descrição**: Lista todas as análises de feedback do usuário
- **Query Params**:
  - `startDate`: Data inicial (opcional)
  - `endDate`: Data final (opcional)
  - `status`: Status da recomendação (opcional)
  - `recommendation_type`: Tipo de recomendação (opcional)
- **Resposta**: Array de análises

#### Buscar Análise
- **GET** `/feedback/weekly/analysis/:id`
- **Descrição**: Retorna uma análise específica
- **Resposta**: Mesmo formato do POST

#### Atualizar Status da Recomendação
- **PATCH** `/feedback/weekly/analysis/:id/status`
- **Descrição**: Atualiza o status de uma recomendação
- **Body**:
  ```json
  {
    "status": "string",
    "feedback_notes": "string"
  }
  ```
- **Resposta**: Análise atualizada

#### Histórico de Recomendações
- **GET** `/feedback/weekly/analysis/history`
- **Descrição**: Retorna o histórico de recomendações
- **Query Params**:
  - `startDate`: Data inicial (opcional)
  - `endDate`: Data final (opcional)
  - `recommendation_type`: Tipo de recomendação (opcional)
- **Resposta**:
  ```json
  [
    {
      "user_id": "string",
      "recommendation_type": "string",
      "status": "string",
      "implementation_date": "date",
      "analysis_summary": "string",
      "key_insights": ["string"],
      "recommended_changes": "object",
      "confidence_score": "number",
      "week_start_date": "date",
      "week_end_date": "date"
    }
  ]
  ```

#### Implementar Recomendação
- **POST** `/feedback/weekly/analysis/:id/implement`
- **Descrição**: Implementa as mudanças recomendadas
- **Body**:
  ```json
  {
    "implementation_notes": "string"
  }
  ```
- **Resposta**: Status da implementação

## Observações

1. Todos os endpoints (exceto login e registro) requerem autenticação via token JWT
2. O token deve ser enviado no header `Authorization: Bearer <token>`
3. Todas as datas são retornadas no formato ISO 8601
4. Todos os IDs são UUIDs
5. Valores numéricos são retornados como números, não strings
6. Campos opcionais podem ser omitidos nas requisições
7. Respostas de erro seguem o formato:
   ```json
   {
     "statusCode": "number",
     "message": "string",
     "error": "string"
   }
   ``` 