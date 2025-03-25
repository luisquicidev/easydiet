import { DietGoalType } from '../entities/user-nutrition-goal.entity';

export class CreateNutritionGoalDto {
    goalType: DietGoalType;
    calorieAdjustment: number;
    mealsPerDay: number;
}