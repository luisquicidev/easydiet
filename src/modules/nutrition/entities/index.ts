// Entidades existentes
export { User } from '../../users/entities/user.entity';
export { MetReference } from './met-reference.entity';
export { UserBiometrics } from './user-biometrics.entity';
export { UserActivity } from './user-activity.entity';
export { UserMetCalculation } from './user-met-calculation.entity';
export { UserNutritionGoal } from './user-nutrition-goal.entity';
export { UserFoodPreference, FoodPreferenceType } from './user-food-preference.entity';
export { DietGenerationJob, DietJobStatusEnum } from './diet-generation-job.entity';

// Novas entidades de cálculos
export { DietCalculation } from './diet-calculation.entity';
export { DietCalculationFormula } from './diet-calculation-formula.entity';
export { DietCalculationMet } from './diet-calculation-met.entity';

// Entidade de plano atualizada
export { DietPlan } from './diet-plan.entity';

// Novas entidades de refeições
export { DietMeal } from './diet-meal.entity';
export { DietMealFood } from './diet-meal-food.entity';
export { DietMealAlternative } from './diet-meal-alternative.entity';
export { DietMealAlternativeFood } from './diet-meal-alternative-food.entity';