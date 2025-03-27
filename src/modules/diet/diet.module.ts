import {forwardRef, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {
    DietGenerationJob,
    DietPlan,
    DietCalculation,
    DietCalculationFormula,
    DietCalculationMet,
    DietMeal,
    DietMealFood,
    DietMealAlternative,
    DietMealAlternativeFood
} from '../nutrition/entities';
import {DietController} from './controllers/diet.controller';
import {NutritionModule} from '../nutrition/nutrition.module';
import {AIModule} from '../../shared/ai/ai.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DietGenerationJob,
            DietPlan,
            DietCalculation,
            DietCalculationFormula,
            DietCalculationMet,
            DietMeal,
            DietMealFood,
            DietMealAlternative,
            DietMealAlternativeFood,
        ]),
        forwardRef(() => NutritionModule),
        AIModule,
    ],
    controllers: [DietController],
    providers: [],
    exports: [],
})
export class DietModule {
}