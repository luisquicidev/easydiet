// DTOs existentes
export { CreateActivityDto } from './create-activity.dto';
export { CreateBiometricsDto } from './create-biometrics.dto';
export { CreateFoodPreferenceDto } from './create-food-preference.dto';
export { CreateNutritionGoalDto } from './create-nutrition-goal.dto';

// Novos DTOs para o sistema de três fases
export {
    CreateDietCalculationDto,
    UpdateDietCalculationDto,
    DietPlanDto,
    CalculationMetDto,
    CalculationFormulaDto
} from './diet-calculation.dto';

export {
    MacronutrientsDto,
    MealFoodDto,
    MealAlternativeDto,
    CreateDietMealDto,
    UpdateDietMealDto
} from './diet-meal.dto';

export {
    CreateDietPlanDto,
    UpdateDietPlanDto,
    DietPlanResponseDto,
    DietPlanWithMealsResponseDto
} from './diet-plan.dto';

export {
    CreateDietProcessDto,
    DietProcessBiometricsDto,
    DietProcessGoalDto,
    DietProcessActivityDto,
    DietProcessStatusDto
} from './create-diet-process.dto';