// src/modules/diet/controllers/diet.controller.ts

import { Controller, Post, Get, Param, Body, UseGuards, Request, NotFoundException, BadRequestException, Logger, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DietService } from '../../nutrition/services/diet.service';
import { DietProcessorService, DietProcessPhase } from '../services/diet-processor.service';
import { NutritionService } from '../../nutrition/services/nutrition.service';
import {
    CreateDietProcessDto,
    DietProcessStatusDto,
    DietPlanResponseDto,
    DietPlanWithMealsResponseDto
} from '../../nutrition/dto';
import { DietJobStatusEnum } from '../../nutrition/entities/diet-generation-job.entity';

@Controller('diet')
@UseGuards(JwtAuthGuard)
export class DietController {
    private readonly logger = new Logger(DietController.name);

    constructor(
        private readonly dietService: DietService,
        private readonly dietProcessorService: DietProcessorService,
        private readonly nutritionService: NutritionService,
    ) {}

    /**
     * Inicia o processo completo de geração de dieta
     */
    @Post('generate')
    async generateDiet(@Body() createDietDto: CreateDietProcessDto, @Request() req) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando processo de geração de dieta para usuário ${userId}`);

        try {
            // Verificar se os dados biométricos existem ou usar os fornecidos
            let biometrics;

            // Verificar createDietDto antes de usar suas propriedades
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
                    throw new BadRequestException('Dados biométricos são obrigatórios para a geração de dieta');
                }
            }

            // Verificar se createDietDto.goal existe
            if (!createDietDto || !createDietDto.goal) {
                throw new BadRequestException('Objetivo nutricional é obrigatório para a geração de dieta');
            }

            // Salvar objetivo nutricional
            const nutritionGoal = await this.nutritionService.saveUserNutritionGoal({
                userId,
                goalType: createDietDto.goal.goalType,
                calorieAdjustment: createDietDto.goal.calorieAdjustment,
                mealsPerDay: createDietDto.goal.mealsPerDay
            });

            // Processar atividades
            const activities: any[] = [];
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

            // Preparar dados para input do job
            const inputData = {
                biometrics,
                goal: nutritionGoal,
                activities,
                dailyActivity: createDietDto.additionalInstructions || '',
            };

            // Criar job de geração de dieta
            const job = await this.dietService.createDietJob(userId, 'diet_generation', inputData);

            // Enfileirar o job para processamento da Fase 1
            await this.dietProcessorService.queueMetabolicCalculation(userId, job.id);

            return {
                message: 'Processo de geração de dieta iniciado com sucesso',
                jobId: job.id,
                status: 'pending',
                currentPhase: DietProcessPhase.CALCULATION
            };
        } catch (error) {
            this.logger.error(`Erro ao iniciar processo de dieta: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Verifica o status atual do processo de geração de dieta
     */
    @Get('process/:jobId')
    async getDietProcessStatus(@Param('jobId') jobId: string, @Request() req): Promise<DietProcessStatusDto> {
        const userId = req.user.userId;

        // Obter o job
        const job = await this.dietService.getDietJob(jobId);

        // Verificar se o job pertence ao usuário
        if (job.userId !== userId) {
            throw new NotFoundException('Processo de dieta não encontrado');
        }

        // Determinar a fase atual com base nos dados do job
        let currentPhase = DietProcessPhase.CALCULATION;
        let calculationId: string | undefined = undefined;
        let planId: string | undefined = undefined;

        if (job.resultData) {
            calculationId = job.resultData.calculationId;

            if (calculationId) {
                // Verificar se há cálculo e sua fase
                try {
                    const calculation = await this.dietService.getDietCalculation(calculationId);
                    currentPhase = calculation.statusPhase;

                    // Se houver planos, pegar o ID do primeiro
                    if (calculation.plans && calculation.plans.length > 0) {
                        planId = calculation.plans[0].id;
                    }
                } catch (error) {
                    this.logger.warn(`Erro ao buscar cálculo para jobId ${jobId}: ${error.message}`);
                }
            }
        }

        // Construir a mensagem adequada com base no status
        let message = 'Processo em andamento';
        if (job.status === DietJobStatusEnum.COMPLETED) {
            message = 'Processo concluído com sucesso';
        } else if (job.status === DietJobStatusEnum.FAILED) {
            message = `Falha no processo: ${job.errorLogs || 'Erro desconhecido'}`;
        }

        return {
            jobId,
            status: job.status,
            progress: job.progress,
            currentPhase,
            message,
            calculationId,
            planId
        };
    }

    /**
     * Obtém o resultado do cálculo metabólico (Fase 1)
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
     * Inicia manualmente a Fase 2 (planejamento de refeições)
     */
    @Post('process/:jobId/plan-meals')
    async planMeals(
        @Param('jobId') jobId: string,
        @Body() body: { calculationId: string, mealsPerDay: number },
        @Request() req
    ) {
        const userId = req.user.userId;

        // Verificar se o job existe e pertence ao usuário
        const job = await this.dietService.getDietJob(jobId);
        if (job.userId !== userId) {
            throw new NotFoundException('Processo não encontrado');
        }

        // Verificar se o cálculo existe e pertence ao usuário
        const calculation = await this.dietService.getDietCalculation(body.calculationId);
        if (calculation.userId !== userId) {
            throw new NotFoundException('Cálculo não encontrado');
        }

        // Verificar se a Fase 1 está completa
        if (calculation.statusPhase < DietProcessPhase.CALCULATION) {
            throw new BadRequestException('O cálculo metabólico (Fase 1) precisa ser concluído antes');
        }

        // Iniciar a Fase 2
        const mealsPerDay = body.mealsPerDay || 4; // Valor padrão se não especificado
        await this.dietProcessorService.queueMealPlanning(userId, jobId, body.calculationId, mealsPerDay);

        return {
            message: 'Planejamento de refeições iniciado com sucesso',
            jobId,
            calculationId: body.calculationId,
            phase: DietProcessPhase.MEAL_PLANNING
        };
    }

    /**
     * Inicia manualmente a Fase 3 (detalhamento de alimentos) para uma refeição específica
     */
    @Post('process/:jobId/detail-foods')
    async detailFoods(
        @Param('jobId') jobId: string,
        @Body() body: { planId: string, mealId: string },
        @Request() req
    ) {
        const userId = req.user.userId;

        // Verificar se o job existe e pertence ao usuário
        const job = await this.dietService.getDietJob(jobId);
        if (job.userId !== userId) {
            throw new NotFoundException('Processo não encontrado');
        }

        // Verificar se o plano existe e pertence ao usuário
        const plan = await this.dietService.getDietPlan(body.planId);
        if (plan.userId !== userId) {
            throw new NotFoundException('Plano não encontrado');
        }

        // Verificar se a refeição existe
        const meal = plan.meals.find(m => m.id === body.mealId);
        if (!meal) {
            throw new NotFoundException('Refeição não encontrada');
        }

        // Iniciar a Fase 3 para esta refeição
        await this.dietProcessorService.queueFoodDetailing(userId, jobId, body.planId, body.mealId);

        return {
            message: 'Detalhamento de alimentos iniciado com sucesso',
            jobId,
            planId: body.planId,
            mealId: body.mealId,
            phase: DietProcessPhase.FOOD_DETAILING
        };
    }

    /**
     * Obtém todos os jobs de geração de dieta do usuário
     */
    @Get('jobs')
    async getUserJobs(@Request() req, @Query('limit') limit: number, @Query('offset') offset: number) {
        const userId = req.user.userId;
        limit = limit || 10; // Valor padrão
        offset = offset || 0; // Valor padrão

        // Assumindo que o método getUserDietJobs não aceita o segundo parâmetro
        // Vamos modificar a chamada para usar apenas o userId
        return this.dietService.getUserDietJobs(userId);

        // Nota: Se precisar implementar paginação, você precisará modificar o método
        // no dietService para aceitar parâmetros de limite e offset
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

    /**
     * Calcula e gera apenas a fase de metabolismo (para compatibilidade com versões anteriores)
     */
    @Post('calculate-metabolism')
    async calculateMetabolism(@Request() req) {
        const userId = req.user.userId;

        // Verificar se o usuário tem os dados necessários
        const biometrics = await this.nutritionService.getUserBiometrics(userId);

        if (!biometrics) {
            throw new BadRequestException('Dados biométricos não encontrados. Por favor, cadastre suas informações primeiro.');
        }

        // Tentar obter objetivos nutricionais
        let nutritionGoal;
        try {
            nutritionGoal = await this.nutritionService.getUserNutritionGoal(userId);
        } catch (error) {
            // Se não existir, criar um objetivo padrão
            nutritionGoal = await this.nutritionService.saveUserNutritionGoal({
                userId,
                goalType: 'maintenance' as import('../../nutrition/entities/user-nutrition-goal.entity').DietGoalType, // Importação explícita do tipo
                calorieAdjustment: 0,
                mealsPerDay: 4
            });
        }

        // Obter atividades físicas
        const activities = await this.nutritionService.getUserActivities(userId);

        // Criar um job de cálculo metabólico
        const job = await this.dietService.createDietJob(userId, 'metabolic_calculation', {
            biometrics,
            goal: nutritionGoal,
            activities
        });

        // Enfileirar o job para processamento
        await this.dietProcessorService.queueMetabolicCalculation(userId, job.id);

        return {
            message: 'Cálculo metabólico iniciado com sucesso',
            jobId: job.id
        };
    }
}