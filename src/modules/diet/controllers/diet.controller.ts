
import { Controller, Post, Get, Param, Body, UseGuards, Request, NotFoundException, BadRequestException, Logger, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DietService } from '../../nutrition/services/diet.service';
import { DietProcessorService, DietProcessPhase } from '../services/diet-processor.service';
import { NutritionService } from '../../nutrition/services/nutrition.service';
import { AIServiceFactory } from '../../../shared/factories/ai-service.factory';
import {
    CreateDietProcessDto,
    DietProcessStatusDto,
    DietPlanResponseDto,
    DietPlanWithMealsResponseDto, MealDetailsDto
} from '../../nutrition/dto';
import { DietJobStatusEnum } from '../../nutrition/entities/diet-generation-job.entity';
import {UserActivity} from "../../nutrition/entities";
import {DietPlanGenerationDto} from "../../nutrition/dto/diet-macronutrients.dto";

@Controller('diet')
@UseGuards(JwtAuthGuard)
export class DietController {
    private readonly logger = new Logger(DietController.name);

    constructor(
        private readonly dietService: DietService,
        private readonly dietProcessorService: DietProcessorService,
        private readonly nutritionService: NutritionService,
        private aiServiceFactory: AIServiceFactory,
    ) {}

    /**
     * Endpoint para cálculo metabólico
     * Calcula TMB, GET e define planos calóricos básicos (Fase 1)
     * Versão atualizada para processamento síncrono
     */
    @Post('calculate-metabolism')
    async calculateMetabolism(@Body() createDietDto: CreateDietProcessDto, @Request() req) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando cálculo metabólico para usuário ${userId}`);

        try {
            // Verificar ou criar dados biométricos
            let biometrics;

            if (createDietDto && createDietDto.biometricsId) {
                // Usar biometria existente
                biometrics = await this.nutritionService.getUserBiometrics(userId);
                if (!biometrics || biometrics.id !== createDietDto.biometricsId) {
                    throw new NotFoundException('Dados biométricos não encontrados');
                }
            } else if (createDietDto && createDietDto.biometrics) {
                // Criar novos dados biométricos
                biometrics = await this.nutritionService.createUserBiometrics(userId, createDietDto.biometrics);
            } else {
                // Tentar obter os dados biométricos mais recentes
                try {
                    biometrics = await this.nutritionService.getUserBiometrics(userId);
                } catch (error) {
                    throw new BadRequestException('Dados biométricos são obrigatórios para o cálculo metabólico');
                }
            }

            // Verificar objetivo nutricional
            if (!createDietDto || !createDietDto.goal) {
                throw new BadRequestException('Objetivo nutricional é obrigatório');
            }

            // Salvar objetivo nutricional
            const nutritionGoal = await this.nutritionService.saveUserNutritionGoal({
                userId,
                goalType: createDietDto.goal.goalType,
                calorieAdjustment: createDietDto.goal.calorieAdjustment,
                mealsPerDay: createDietDto.goal.mealsPerDay
            });

            // Processar atividades
            const activities: UserActivity[] = [];
            if (createDietDto.activities && createDietDto.activities.length > 0) {
                const newActivities = await Promise.all(
                    createDietDto.activities.map(activity =>
                        this.nutritionService.addUserActivity(userId, activity)
                    )
                );
                activities.push(...newActivities);
            } else {
                // Obter atividades existentes
                const existingActivities = await this.nutritionService.getUserActivities(userId);
                activities.push(...existingActivities);
            }

            // Criar job de cálculo metabólico
            const job = await this.dietService.createDietJob(userId, 'metabolic_calculation', {
                biometrics,
                goal: nutritionGoal,
                activities,
                dailyActivity: createDietDto.additionalInstructions || '',
            });

            // Processar o job de forma síncrona
            try {
                // Executar o cálculo metabólico e obter o resultado
                const calculation = await this.dietService.processMetabolicCalculationJob(job.id);

                // Buscar o job atualizado para confirmar o status
                const updatedJob = await this.dietService.getDietJob(job.id);

                return {
                    success: true,
                    message: 'Cálculo metabólico concluído com sucesso',
                    jobId: job.id,
                    calculationId: calculation.id,
                    phase: DietProcessPhase.CALCULATION,
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
            } catch (error) {
                // Em caso de erro, garantir que o status do job seja atualizado
                this.logger.error(`Erro no processamento do cálculo metabólico: ${error.message}`, error.stack);

                throw error;
            }
        } catch (error) {
            this.logger.error(`Erro no cálculo metabólico: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Adicione este novo endpoint ao DietController

    /**
     * Endpoint para planejamento de refeições (Fase 2)
     * Distribui macronutrientes em refeições ao longo do dia
     * Versão atualizada para processamento síncrono
     */
    @Post('plan-meals')
    async planMeals(
        @Body() body: { calculationId: string, mealsPerDay: number },
        @Request() req
    ) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando planejamento de refeições para usuário ${userId}, calculationId ${body.calculationId}`);

        try {
            // Verificar se o cálculo existe e pertence ao usuário
            const calculation = await this.dietService.getDietCalculation(body.calculationId);
            if (calculation.userId !== userId) {
                throw new NotFoundException('Cálculo não encontrado');
            }

            // Verificar se a Fase 1 está completa
            if (calculation.statusPhase < DietProcessPhase.CALCULATION) {
                throw new BadRequestException('O cálculo metabólico (Fase 1) precisa ser concluído antes');
            }

            // Número de refeições por dia (usar valor do corpo da requisição ou do objetivo nutricional)
            const mealsPerDay = body.mealsPerDay || await this.getDefaultMealsPerDay(userId);

            // Criar um novo job para o planejamento de refeições
            const job = await this.dietService.createDietJob(userId, 'meal_planning', {
                calculationId: body.calculationId,
                mealsPerDay: mealsPerDay
            });

            // Atualizar o status do job para "processando"
            await this.dietService.updateDietJob(job.id, {
                status: DietJobStatusEnum.PROCESSING,
                progress: 10
            });

            try {
                // Preparar planos para o prompt
                const planPromptData = calculation.plans.map(plan => ({
                    name: plan.name,
                    totalCalories: plan.totalCalories,
                    application: plan.application,
                    macronutrients: {
                        protein: plan.protein,
                        carbs: plan.carbs,
                        fat: plan.fat
                    }
                }));

                // Gerar prompt para planejamento de refeições
                const prompt = this.dietService.generateMealPlanningPrompt(planPromptData, mealsPerDay);

                // Atualizar progresso
                await this.dietService.updateDietJob(job.id, { progress: 30 });

                // Chamar serviço de IA
                const aiService = this.aiServiceFactory.getServiceWithFallback();
                const response = await aiService.generateJsonCompletion(prompt);

                // Atualizar progresso
                await this.dietService.updateDietJob(job.id, { progress: 60 });

                // Salvar as refeições para cada plano
                await this.dietService.saveMealPlans(
                    job.id,
                    body.calculationId,
                    response.content as DietPlanGenerationDto
                );

                // Atualizar a fase do cálculo
                await this.dietService.updateDietCalculation(body.calculationId, {
                    statusPhase: DietProcessPhase.MEAL_PLANNING
                });

                // Atualizar status do job para completado
                await this.dietService.updateDietJob(job.id, {
                    status: DietJobStatusEnum.COMPLETED,
                    progress: 100,
                    resultData: {
                        calculationId: body.calculationId,
                        mealsPerDay: mealsPerDay
                    }
                });

                // Obter os planos atualizados com as refeições
                const updatedPlans = await Promise.all(
                    calculation.plans.map(plan => this.dietService.getDietPlan(plan.id))
                );

                // Preparar resposta
                return {
                    success: true,
                    message: 'Planejamento de refeições concluído com sucesso',
                    jobId: job.id,
                    calculationId: body.calculationId,
                    phase: DietProcessPhase.MEAL_PLANNING,
                    plans: updatedPlans.map(plan => ({
                        id: plan.id,
                        name: plan.name,
                        totalCalories: plan.totalCalories,
                        mealsCount: plan.meals?.length || 0,
                        meals: plan.meals?.map(meal => ({
                            id: meal.id,
                            name: meal.name,
                            macronutrients: {
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fat: meal.fat,
                                calories: meal.calories
                            }
                        }))
                    }))
                };
            } catch (error) {
                // Em caso de erro, atualizar o status do job
                this.logger.error(`Erro no processamento do planejamento de refeições: ${error.message}`, error.stack);
                await this.dietService.updateDietJob(job.id, {
                    status: DietJobStatusEnum.FAILED,
                    errorLogs: error.message || 'Erro desconhecido durante o planejamento de refeições',
                    progress: 0
                });

                throw error;
            }
        } catch (error) {
            this.logger.error(`Erro no planejamento de refeições: ${error.message}`, error.stack);
            throw error;
        }
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
            // Verificar se a refeição existe
            const meal = await this.dietService.getMeal(body.mealId);
            if (!meal) {
                throw new NotFoundException('Refeição não encontrada');
            }

            // Obter o plano associado à refeição
            const plan = await this.dietService.getDietPlan(meal.planId);

            // Verificar se o plano pertence ao usuário
            if (plan.userId !== userId) {
                throw new NotFoundException('Plano não encontrado');
            }

            // Verificar se a Fase 2 está completa
            const calculation = await this.dietService.getDietCalculation(plan.calculationId);
            if (calculation.statusPhase < DietProcessPhase.MEAL_PLANNING) {
                throw new BadRequestException('O planejamento de refeições (Fase 2) precisa ser concluído antes');
            }

            // Criar um job para rastreamento do detalhamento de alimentos
            const job = await this.dietService.createDietJob(userId, 'food_detailing', {
                mealId: body.mealId,
                planId: plan.id,
                calculationId: plan.calculationId
            });

            // Atualizar status para processando
            await this.dietService.updateDietJob(job.id, {
                status: DietJobStatusEnum.PROCESSING,
                progress: 10
            });

            try {
                // Obter preferências alimentares do usuário
                const foodPreferences = await this.nutritionService.getUserFoodPreferences(userId);

                // Obter dados biométricos (opcional, para contexto)
                let biometrics;
                try {
                    biometrics = await this.nutritionService.getUserBiometrics(userId);
                } catch (error) {
                    this.logger.warn(`Biometrics not found for user ${userId}, proceeding without them`);
                }

                // Determinar a posição da refeição no plano
                const mealPosition = plan.meals?.findIndex(m => m.id === meal.id) + 1 || 1;
                const totalMeals = plan.meals?.length || 1;

                // Atualizar progresso
                await this.dietService.updateDietJob(job.id, { progress: 30 });

                // Determinar tipo de dieta com base no objetivo do usuário
                const dietType = await this.getDietTypeFromUserGoal(userId);

                // Gerar prompt para detalhamento de alimentos
                const prompt = this.dietService.generateFoodDetailingPrompt(
                    meal,
                    foodPreferences,
                    mealPosition,
                    totalMeals,
                    dietType,
                    biometrics
                );

                // Atualizar progresso
                await this.dietService.updateDietJob(job.id, { progress: 50 });

                // Chamar serviço de IA
                const aiService = this.aiServiceFactory.getServiceWithFallback();
                const response = await aiService.generateJsonCompletion(prompt);

                // Validar resposta
                if (!response || !response.content) {
                    throw new Error('Falha ao gerar detalhes da refeição');
                }

                // Atualizar progresso
                await this.dietService.updateDietJob(job.id, { progress: 70 });

                // Salvar os detalhes dos alimentos
                await this.dietService.saveMealDetails(meal.id, response.content as MealDetailsDto);

                // Obter a refeição atualizada com os alimentos detalhados
                const updatedMeal = await this.dietService.getMeal(meal.id);

                // Verificar se todas as refeições do plano já foram detalhadas
                const allMealsDetailed = await this.areAllMealsDetailed(plan.id);

                // Se todas as refeições estiverem detalhadas, atualizar o status
                if (allMealsDetailed) {
                    await this.dietService.updateDietCalculation(plan.calculationId, {
                        statusPhase: DietProcessPhase.FOOD_DETAILING
                    });
                }

                // Atualizar status do job para completado
                await this.dietService.updateDietJob(job.id, {
                    status: DietJobStatusEnum.COMPLETED,
                    progress: 100,
                    resultData: {
                        mealId: meal.id,
                        planId: plan.id,
                        calculationId: plan.calculationId,
                        allMealsDetailed: allMealsDetailed
                    }
                });

                // Preparar resposta
                return {
                    success: true,
                    message: 'Detalhamento de alimentos concluído com sucesso',
                    jobId: job.id,
                    mealId: meal.id,
                    planId: plan.id,
                    allMealsDetailed: allMealsDetailed,
                    meal: {
                        name: updatedMeal.name,
                        macronutrients: {
                            protein: updatedMeal.protein,
                            carbs: updatedMeal.carbs,
                            fat: updatedMeal.fat,
                            calories: updatedMeal.calories
                        },
                        foods: updatedMeal.foods?.map(food => ({
                            name: food.name,
                            grams: food.grams,
                            macronutrients: {
                                protein: food.protein,
                                carbs: food.carbs,
                                fat: food.fat,
                                calories: food.calories
                            }
                        })),
                        howTo: updatedMeal.howTo,
                        alternatives: updatedMeal.alternatives?.map(alt => ({
                            name: alt.name,
                            macronutrients: {
                                protein: alt.protein,
                                carbs: alt.carbs,
                                fat: alt.fat,
                                calories: alt.calories
                            },
                            foods: alt.foods?.map(food => ({
                                name: food.name,
                                grams: food.grams,
                                macronutrients: {
                                    protein: food.protein,
                                    carbs: food.carbs,
                                    fat: food.fat,
                                    calories: food.calories
                                }
                            }))
                        }))
                    }
                };
            } catch (error) {
                // Em caso de erro, atualizar o status do job
                this.logger.error(`Erro no processamento do detalhamento de alimentos: ${error.message}`, error.stack);
                await this.dietService.updateDietJob(job.id, {
                    status: DietJobStatusEnum.FAILED,
                    errorLogs: error.message || 'Erro desconhecido durante o detalhamento de alimentos',
                    progress: 0
                });

                throw error;
            }
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
     * Verifica se todas as refeições de um plano já foram detalhadas
     */
    private async areAllMealsDetailed(planId: string): Promise<boolean> {
        const plan = await this.dietService.getDietPlan(planId);

        if (!plan.meals || plan.meals.length === 0) {
            return false;
        }

        // Uma refeição está detalhada se tiver alimentos associados
        for (const meal of plan.meals) {
            if (!meal.foods || meal.foods.length === 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Obtém o número padrão de refeições por dia para o usuário
     */
    private async getDefaultMealsPerDay(userId: number): Promise<number> {
        try {
            const nutritionGoal = await this.nutritionService.getUserNutritionGoal(userId);
            return nutritionGoal?.mealsPerDay || 4; // Valor padrão: 4 refeições
        } catch (error) {
            this.logger.warn(`Não foi possível obter o objetivo nutricional do usuário ${userId}: ${error.message}`);
            return 4; // Valor padrão
        }
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