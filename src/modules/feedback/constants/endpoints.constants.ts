export const DIET_ENDPOINTS = {
  ADJUST_PLAN: {
    path: '/diet/plan/adjust',
    method: 'PATCH',
    description: 'Ajusta o plano alimentar com novas calorias e macronutrientes',
    requiredData: {
      caloric_adjustment: 'number',
      macro_adjustments: {
        protein: 'number',
        carbs: 'number',
        fats: 'number'
      }
    }
  },
  UPDATE_MEAL_TIMING: {
    path: '/diet/plan/meals/timing',
    method: 'PATCH',
    description: 'Atualiza o timing das refeições',
    requiredData: {
      meal_timing: 'string[]'
    }
  },
  UPDATE_FOOD_PREFERENCES: {
    path: '/diet/plan/foods/preferences',
    method: 'PATCH',
    description: 'Atualiza preferências alimentares',
    requiredData: {
      food_recommendations: 'string[]'
    }
  },
  RECALCULATE_CALORIES: {
    path: '/diet/plan/calories/recalculate',
    method: 'POST',
    description: 'Recalcula necessidades calóricas',
    requiredData: {
      measurements: 'Measurement[]',
      activity_level: 'string',
      goals: 'Goal[]'
    }
  }
};

export const WORKOUT_ENDPOINTS = {
  ADJUST_INTENSITY: {
    path: '/workout/plan/intensity',
    method: 'PATCH',
    description: 'Ajusta a intensidade dos treinos',
    requiredData: {
      intensity_adjustment: 'string'
    }
  },
  ADJUST_FREQUENCY: {
    path: '/workout/plan/frequency',
    method: 'PATCH',
    description: 'Ajusta a frequência dos treinos',
    requiredData: {
      frequency_adjustment: 'string'
    }
  },
  UPDATE_EXERCISES: {
    path: '/workout/plan/exercises',
    method: 'PATCH',
    description: 'Atualiza exercícios recomendados',
    requiredData: {
      exercise_recommendations: 'string[]'
    }
  }
};

export const LIFESTYLE_ENDPOINTS = {
  UPDATE_SLEEP_SCHEDULE: {
    path: '/lifestyle/sleep/schedule',
    method: 'PATCH',
    description: 'Atualiza horários de sono',
    requiredData: {
      sleep_schedule: {
        bedtime: 'string',
        wakeup_time: 'string'
      }
    }
  },
  UPDATE_STRESS_MANAGEMENT: {
    path: '/lifestyle/stress/management',
    method: 'PATCH',
    description: 'Atualiza práticas de gerenciamento de estresse',
    requiredData: {
      stress_management_activities: 'string[]'
    }
  }
};

export const PLAN_ENDPOINTS = {
  RESTRUCTURE_PLAN: {
    path: '/plan/restructure',
    method: 'POST',
    description: 'Reestrutura completamente o plano',
    requiredData: {
      diet_changes: 'DietChanges',
      workout_changes: 'WorkoutChanges',
      lifestyle_changes: 'string[]'
    }
  },
  UPDATE_GOALS: {
    path: '/plan/goals',
    method: 'PATCH',
    description: 'Atualiza objetivos do plano',
    requiredData: {
      goals: 'Goal[]'
    }
  }
};

export const ENDPOINTS = {
  ...DIET_ENDPOINTS,
  ...WORKOUT_ENDPOINTS,
  ...LIFESTYLE_ENDPOINTS,
  ...PLAN_ENDPOINTS
}; 