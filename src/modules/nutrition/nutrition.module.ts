import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetReference } from './entities/met-reference.entity';
import { UserBiometrics } from './entities/user-biometrics.entity';
import { UserActivity } from './entities/user-activity.entity';
import { UserMetCalculation } from './entities/user-met-calculation.entity';
import { UserNutritionGoal } from './entities/user-nutrition-goal.entity';
import { UserFoodPreference } from './entities/user-food-preference.entity';
import { DietGenerationJob } from './entities/diet-generation-job.entity';
import { DietPlan } from './entities/diet-plan.entity';
import { DietCalculation } from './entities/diet-calculation.entity';
import { DietCalculationFormula } from './entities/diet-calculation-formula.entity';
import { DietCalculationMet } from './entities/diet-calculation-met.entity';
import { DietMeal } from './entities/diet-meal.entity';
import { DietMealFood } from './entities/diet-meal-food.entity';
import { DietMealAlternative } from './entities/diet-meal-alternative.entity';
import { DietMealAlternativeFood } from './entities/diet-meal-alternative-food.entity';
import { NutritionController } from './controllers/nutrition.controller';
import { NutritionService } from './services/nutrition.service';
import { DietService } from './services/diet.service';
import { UsersModule } from '../users/users.module';
// Importar o módulo de IA
import { AIModule } from '../../shared/ai/ai.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            // Entidades existentes
            MetReference,
            UserBiometrics,
            UserActivity,
            UserMetCalculation,
            UserNutritionGoal,
            UserFoodPreference,
            DietGenerationJob,
            DietPlan,

            // Novas entidades para o sistema de três fases
            DietCalculation,
            DietCalculationFormula,
            DietCalculationMet,
            DietMeal,
            DietMealFood,
            DietMealAlternative,
            DietMealAlternativeFood,
        ]),
        UsersModule,
        // Adicionando o módulo de IA
        AIModule,
    ],
    controllers: [NutritionController],
    providers: [NutritionService, DietService],
    exports: [NutritionService, DietService],
})
export class NutritionModule {}