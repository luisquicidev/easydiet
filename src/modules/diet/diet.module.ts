import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DietGenerationJob } from '../nutrition/entities/diet-generation-job.entity';
import { DietPlan } from '../nutrition/entities/diet-plan.entity';
import { DietCalculation } from '../nutrition/entities/diet-calculation.entity';
import { DietCalculationFormula } from '../nutrition/entities/diet-calculation-formula.entity';
import { DietCalculationMet } from '../nutrition/entities/diet-calculation-met.entity';
import { DietMeal } from '../nutrition/entities/diet-meal.entity';
import { DietMealFood } from '../nutrition/entities/diet-meal-food.entity';
import { DietMealAlternative } from '../nutrition/entities/diet-meal-alternative.entity';
import { DietMealAlternativeFood } from '../nutrition/entities/diet-meal-alternative-food.entity';
import { DietController } from './controllers/diet.controller';
import { DietProcessorService } from './services/diet-processor.service';
import { DietQueueProcessor } from './processors/diet-queue.processor';
import { NutritionModule } from '../nutrition/nutrition.module';
import { AIModule } from '../../shared/ai/ai.module';
import {DietService} from "../nutrition/services/diet.service";

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
        BullModule.registerQueue({
            name: 'diet-generation',
            // Opções específicas para a fila diet-generation
            defaultJobOptions: {
                attempts: 5, // Mais tentativas para jobs de geração de dieta
                backoff: {
                    type: 'exponential',
                    delay: 2000, // Atraso inicial maior para evitar sobrecarregar as APIs de IA
                },
                timeout: 120000, // Timeout de 2 minutos
                removeOnComplete: 50, // Mantém apenas os últimos 50 jobs completos
                removeOnFail: 100, // Mantém os últimos 100 jobs que falharam para análise
            },
        }),
        forwardRef(() => NutritionModule),
        AIModule,
    ],
    controllers: [DietController],
    providers: [DietProcessorService],
    exports: [DietProcessorService],
})
export class DietModule {}