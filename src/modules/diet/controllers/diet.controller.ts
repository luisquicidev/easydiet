
import { Controller, Post, Get, Param, Body, UseGuards, Request, NotFoundException, BadRequestException, Logger, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DietService } from '../../nutrition/services/diet.service';
import { NutritionService } from '../../nutrition/services/nutrition.service';
import { AIServiceFactory } from '../../../shared/factories/ai-service.factory';
import {
    DietPlanResponseDto,
    DietPlanWithMealsResponseDto, MealDetailsDto
} from '../../nutrition/dto';

@Controller('diet')
@UseGuards(JwtAuthGuard)
export class DietController {
    private readonly logger = new Logger(DietController.name);

    constructor(
        private readonly dietService: DietService,
        private readonly nutritionService: NutritionService,
        private aiServiceFactory: AIServiceFactory,
    ) {}

    /**
     * Endpoint para cálculo metabólico
     * Calcula TMB, GET e define planos calóricos básicos (Fase 1)
     * Versão atualizada para processamento síncrono
     */
    @Post('calculate-metabolism')
    async calculateMetabolism(@Request() req) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando cálculo metabólico para usuário ${userId}`);
        const calculation = await this.dietService.processMetabolicCalculation(userId);

        return {
            success: true,
            message: 'Cálculo metabólico concluído com sucesso',
            jobId: calculation.jobId,
            calculationId: calculation.id,
            plans: calculation.plans.map(plan => ({
                id: plan.id,
                name: plan.name,
                totalCalories: plan.totalCalories,
                macronutrients: {
                    protein: plan.protein,
                    carbs: plan.carbs,
                    fat: plan.fat
                },
                application: plan.application
            }))
        };
    }

    /**
     * Endpoint para planejamento de refeições (Fase 2)
     * Distribui macronutrientes em refeições ao longo do dia
     * Versão atualizada para processamento síncrono
     */
    @Post('plan-meals')
    async planMeals(
        @Request() req
    ) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando planejamento de refeições para usuário ${userId}`);

        const plans = await this.dietService.processMealPlanning(userId);

        return {
            success: true,
            message: 'Distribuição de macronutrientes realizada com sucesso',
            plans
        };
    }

    // Adicione este novo endpoint ao DietController

    /**
     * Endpoint para detalhamento de alimentos (Fase 3)
     * Define os alimentos específicos para uma refeição
     * Versão atualizada para processamento síncrono
     */
    @Post('detail-foods')
    async detailFoods(
        @Body() body: { mealId: string },
        @Request() req
    ) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando detalhamento de alimentos para usuário ${userId}, refeição ${body.mealId}`);

        try {
            const meal = await this.dietService.getMeal(body.mealId);
            const plan = await this.dietService.getDietPlan(meal.planId);

            const foodPreferences = await this.nutritionService.getUserFoodPreferences(userId);
            const biometrics = await this.nutritionService.getUserBiometrics(userId);
            const mealPosition = meal.sortOrder;
            const totalMeals = plan.meals?.length || 1;

            const dietType = await this.getDietTypeFromUserGoal(userId);

            const prompt = this.dietService.generateFoodDetailingPrompt(
                meal,
                foodPreferences,
                mealPosition,
                totalMeals,
                dietType,
                biometrics
            );

            const aiService = this.aiServiceFactory.getServiceWithFallback();
            const response = await aiService.generateJsonCompletion<MealDetailsDto>(prompt);

            await this.dietService.saveMealDetails(meal.id, response.content as MealDetailsDto);

            const updatedMeal = await this.dietService.getMeal(meal.id);

            return {
                success: true,
                message: 'Detalhamento de alimentos concluído com sucesso',
                mealId: meal.id,
                planId: plan.id,
                meal: updatedMeal
            };

        } catch (error) {
            this.logger.error(`Erro no detalhamento de alimentos: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Endpoint para detalhamento de alimentos (Fase 3)
     * Define os alimentos específicos para uma refeição
     * Versão atualizada para processamento síncrono
     */
    @Post('generate-alternative')
    async detailFoods(
        @Body() body: { mealId: string },
        @Request() req
    ) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando detalhamento de alimentos para usuário ${userId}, refeição ${body.mealId}`);

        try {
            const meal = await this.dietService.getMeal(body.mealId);
            const plan = await this.dietService.getDietPlan(meal.planId);

            const foodPreferences = await this.nutritionService.getUserFoodPreferences(userId);
            const biometrics = await this.nutritionService.getUserBiometrics(userId);
            const mealPosition = meal.sortOrder;
            const totalMeals = plan.meals?.length || 1;

            const dietType = await this.getDietTypeFromUserGoal(userId);

            const prompt = this.dietService.generateFoodDetailingPrompt(
                meal,
                foodPreferences,
                mealPosition,
                totalMeals,
                dietType,
                biometrics
            );

            const aiService = this.aiServiceFactory.getServiceWithFallback();
            const response = await aiService.generateJsonCompletion<MealDetailsDto>(prompt);

            await this.dietService.saveMealDetails(meal.id, response.content as MealDetailsDto);

            const updatedMeal = await this.dietService.getMeal(meal.id);

            return {
                success: true,
                message: 'Detalhamento de alimentos concluído com sucesso',
                mealId: meal.id,
                planId: plan.id,
                meal: updatedMeal
            };

        } catch (error) {
            this.logger.error(`Erro no detalhamento de alimentos: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Determina o tipo de dieta com base no objetivo do usuário
     */
    private async getDietTypeFromUserGoal(userId: number): Promise<string> {
        try {
            const nutritionGoal = await this.nutritionService.getUserNutritionGoal(userId);
            if (nutritionGoal) {
                switch (nutritionGoal.goalType) {
                    case 'weightLoss':
                        return nutritionGoal.calorieAdjustment <= -15 ? 'low-carb' : 'balanced';
                    case 'weightGain':
                        return 'high-protein';
                    default:
                        return 'balanced';
                }
            }
        } catch (error) {
            this.logger.warn(`Não foi possível obter o objetivo nutricional: ${error.message}`);
        }
        return 'balanced'; // Valor padrão
    }

    /**
     * Obtém o resultado do cálculo metabólico
     */
    @Get('calculation/:calculationId')
    async getDietCalculation(@Param('calculationId') calculationId: string, @Request() req) {
        const userId = req.user.userId;
        const calculation = await this.dietService.getDietCalculation(calculationId);

        // Verificar se o cálculo pertence ao usuário
        if (calculation.userId !== userId) {
            throw new NotFoundException('Cálculo não encontrado');
        }

        return calculation;
    }

    /**
     * Obtém todos os planos de dieta do usuário
     */
    @Get('plans')
    async getUserPlans(@Request() req): Promise<DietPlanResponseDto[]> {
        const plans = await this.dietService.getUserDietPlans(req.user.userId);

        // Mapear os planos para o formato de resposta esperado
        return plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            totalCalories: plan.totalCalories || 0,
            macronutrients: {
                protein: plan.protein || 0,
                carbs: plan.carbs || 0,
                fat: plan.fat || 0
            },
            application: plan.application,
            isActive: plan.isActive || true,
            calculationId: plan.calculationId,
            jobId: plan.jobId
        }));
    }

    /**
     * Obtém um plano de dieta específico com suas refeições
     */
    @Get('plans/:planId')
    async getDietPlan(@Param('planId') planId: string, @Request() req): Promise<DietPlanWithMealsResponseDto> {
        const userId = req.user.userId;
        const plan = await this.dietService.getDietPlan(planId);

        // Verificar se o plano pertence ao usuário
        if (plan.userId !== userId) {
            throw new NotFoundException('Plano não encontrado');
        }

        // Mapear o plano para o formato de resposta esperado
        const response: DietPlanWithMealsResponseDto = {
            id: plan.id,
            name: plan.name,
            totalCalories: plan.totalCalories || 0,
            macronutrients: {
                protein: plan.protein || 0,
                carbs: plan.carbs || 0,
                fat: plan.fat || 0
            },
            application: plan.application,
            isActive: plan.isActive || true,
            calculationId: plan.calculationId,
            jobId: plan.jobId,
            meals: plan.meals?.map(meal => ({
                planId: meal.planId,
                name: meal.name,
                macronutrients: {
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    calories: meal.calories
                },
                foods: meal.foods?.map(food => ({
                    name: food.name,
                    grams: food.grams,
                    macronutrients: {
                        protein: food.protein,
                        carbs: food.carbs,
                        fat: food.fat,
                        calories: food.calories
                    },
                    alternativeGroup: food.alternativeGroup,
                    sortOrder: food.sortOrder || 0
                })) || [],
                howTo: meal.howTo,
                alternatives: meal.alternatives?.map(alt => ({
                    name: alt.name,
                    macronutrients: {
                        protein: alt.protein,
                        carbs: alt.carbs,
                        fat: alt.fat,
                        calories: alt.calories
                    },
                    howTo: alt.howTo,
                    foods: alt.foods?.map(food => ({
                        name: food.name,
                        grams: food.grams,
                        macronutrients: {
                            protein: food.protein,
                            carbs: food.carbs,
                            fat: food.fat,
                            calories: food.calories
                        },
                        sortOrder: food.sortOrder || 0
                    })) || [],
                    sortOrder: alt.sortOrder
                })) || [],
                sortOrder: meal.sortOrder
            })) || []
        };

        return response;
    }

    /**
     * Obtém um job específico
     */
    @Get('jobs/:jobId')
    async getJobStatus(@Param('jobId') jobId: string, @Request() req) {
        const job = await this.dietService.getDietJob(jobId);

        // Verificar se o job pertence ao usuário
        if (job.userId !== req.user.userId) {
            throw new NotFoundException('Job não encontrado');
        }

        return job;
    }
}