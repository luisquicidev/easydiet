```mermaid
erDiagram
    %% Tabelas Existentes
    users {
        uuid id PK
        string email
        string name
        timestamp created_at
        timestamp updated_at
    }

    user_biometrics {
        uuid id PK
        integer user_id FK
        decimal weight
        decimal height
        integer age
        string gender
        decimal lean_mass
        timestamp created_at
        timestamp updated_at
    }

    user_activities {
        uuid id PK
        integer user_id FK
        string met_code
        integer frequency_per_week
        integer duration_minutes
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    diet_meals {
        uuid id PK
        uuid plan_id FK
        string name
        integer sort_order
        decimal protein
        decimal carbs
        decimal fat
        decimal calories
        text how_to
        text serving_suggestion
        boolean is_customized
        text customization_reason
        text[] available_ingredients
        timestamp created_at
        timestamp updated_at
    }

    diet_meal_foods {
        uuid id PK
        uuid meal_id FK
        string name
        decimal grams
        decimal protein
        decimal carbs
        decimal fat
        decimal calories
        integer alternative_group
        integer sort_order
        timestamp created_at
    }

    %% Novas Tabelas para Feedback
    meal_feedback {
        uuid id PK
        uuid user_id FK
        uuid meal_id FK
        timestamp date
        integer satisfaction_rating
        enum adherence_status
        text modification_reason
        integer energy_level
        integer hunger_level
        enum mood
        integer stress_level
        integer motivation_level
        text comments
        timestamp created_at
        timestamp updated_at
    }

    meal_feedback_modifications {
        uuid id PK
        uuid feedback_id FK
        uuid original_food_id FK
        uuid replacement_food_id FK
        decimal quantity_changed
        text reason
        timestamp created_at
    }

    daily_feedback_summary {
        uuid id PK
        uuid user_id FK
        date date
        decimal overall_adherence
        decimal average_satisfaction
        decimal average_energy
        enum average_mood
        text[] key_insights
        text[] ai_suggestions
        timestamp created_at
        timestamp updated_at
    }

    feedback_reminders {
        uuid id PK
        uuid user_id FK
        uuid meal_id FK
        time reminder_time
        boolean is_active
        enum notification_method
        timestamp created_at
        timestamp updated_at
    }

    %% Relacionamentos Existentes
    users ||--o{ user_biometrics : "has"
    users ||--o{ user_activities : "has"
    diet_meals ||--o{ diet_meal_foods : "contains"

    %% Novos Relacionamentos
    users ||--o{ meal_feedback : "provides"
    diet_meals ||--o{ meal_feedback : "receives"
    meal_feedback ||--o{ meal_feedback_modifications : "has"
    diet_meal_foods ||--o{ meal_feedback_modifications : "modified_in"
    users ||--o{ daily_feedback_summary : "has"
    users ||--o{ feedback_reminders : "has"
    diet_meals ||--o{ feedback_reminders : "has"
} 