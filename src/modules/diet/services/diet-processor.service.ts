import {forwardRef, Inject, Injectable, Logger} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { DietService } from '../../nutrition/services/diet.service';
import { DietGenerationJob, DietJobStatusEnum } from '../../nutrition/entities/diet-generation-job.entity';
import { NutritionService } from '../../nutrition/services/nutrition.service';
import { DietCalculation } from '../../nutrition/entities/diet-calculation.entity';
import {DietMeal, DietPlan, FoodPreferenceType} from "../../nutrition/entities";
import {MealDetailsDto} from "../../nutrition/dto";
import {AIServiceFactory} from "../../../shared/factories/ai-service.factory";
import {DietGoalType} from "../../nutrition/entities/user-nutrition-goal.entity";

export enum DietProcessPhase {
    CALCULATION = 1,
    MEAL_PLANNING = 2,
    FOOD_DETAILING = 3
}

export interface MetabolicCalculationData {
    userId: number;
    jobId: string;
    biometricsId?: string;
}

export interface MealPlanningData {
    userId: number;
    jobId: string;
    calculationId: string;
    mealsPerDay: number;
}

export interface FoodDetailingData {
    userId: number;
    jobId: string;
    planId: string;
    mealId: string;
}

@Injectable()
export class DietProcessorService {
    private readonly logger = new Logger(DietProcessorService.name);

    constructor(
        @InjectQueue('diet-generation')
        private readonly dietQueue: Queue,
        @Inject(forwardRef(() => DietService))
        private readonly dietService: DietService,
        private readonly nutritionService: NutritionService,
        private readonly aiServiceFactory: AIServiceFactory,
    ) {}

    /**
     * Enfileira um job para cálculo metabólico (Fase 1)
     */
    async queueMetabolicCalculation(userId: number, jobId: string): Promise<Job<MetabolicCalculationData>> {
        this.logger.log(`Queueing metabolic calculation for user ${userId}, jobId ${jobId}`);

        const jobData: MetabolicCalculationData = {
            userId,
            jobId
        };

        // Adicionar à fila Bull
        const job = await this.dietQueue.add('metabolic-calculation', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        this.logger.log(`Added job ${job.id} to queue`);
        return job;
    }

    /**
     * Processa um job de cálculo metabólico (Fase 1)
     */
    async processMetabolicCalculation(job: Job<MetabolicCalculationData>): Promise<void> {
        const { userId, jobId } = job.data;
        this.logger.log(`Processing metabolic calculation for user ${userId}, jobId ${jobId}`);

        try {
            // Processar o cálculo metabólico usando o DietService
            await this.dietService.processMetabolicCalculationJob(jobId);

            // Obter o job atualizado
            const updatedJob = await this.dietService.getDietJob(jobId);

            // Se o job foi concluído com sucesso, enfileirar a próxima fase
            if (updatedJob.status === DietJobStatusEnum.COMPLETED) {
                // Extrair o ID do cálculo do resultData
                const calculationId = updatedJob.resultData?.calculationId;

                if (calculationId) {
                    // Obter o objetivo nutricional do usuário para saber o número de refeições
                    const nutritionGoal = await this.nutritionService.getUserNutritionGoal(userId);
                    const mealsPerDay = nutritionGoal?.mealsPerDay || 4; // Valor padrão se não estiver definido

                    // Enfileirar a Fase 2 (Meal Planning)
                    await this.queueMealPlanning(userId, jobId, calculationId, mealsPerDay);
                } else {
                    this.logger.error(`No calculation ID found in job result data for job ${jobId}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error processing metabolic calculation: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Enfileira um job para planejamento de refeições (Fase 2)
     */
    async queueMealPlanning(
        userId: number,
        jobId: string,
        calculationId: string,
        mealsPerDay: number
    ): Promise<Job<MealPlanningData>> {
        this.logger.log(`Queueing meal planning for user ${userId}, jobId ${jobId}, calculationId ${calculationId}, mealsPerDay ${mealsPerDay}`);

        const jobData: MealPlanningData = {
            userId,
            jobId,
            calculationId,
            mealsPerDay
        };

        try {
            // Atualizar o job para indicar que a fase 2 está pendente
            const updatedJob = await this.dietService.updateDietJob(jobId, {
                status: DietJobStatusEnum.PROCESSING,
                progress: 33, // 1/3 do processo concluído
            });
            this.logger.log(`Job atualizado após enfileirar planejamento de refeições: ${JSON.stringify(updatedJob, null, 2)}`);

            // Atualizar o cálculo para indicar que estamos na fase 2
            const updatedCalculation = await this.updateCalculationPhase(calculationId, DietProcessPhase.MEAL_PLANNING);
            this.logger.log(`Cálculo atualizado após mudança de fase: ${JSON.stringify(updatedCalculation, null, 2)}`);

            // Adicionar à fila Bull
            const job = await this.dietQueue.add('meal-planning', jobData, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            });

            this.logger.log(`Added job ${job.id} to queue`);
            return job;
        } catch (error) {
            this.logger.error(`Erro ao enfileirar planejamento de refeições: ${error.message}`, error.stack);
            throw error;
        }
    }

    private async updateCalculationPhase(calculationId: string, phase: DietProcessPhase): Promise<DietCalculation | null> {
        try {
            const calculation = await this.dietService.getDietCalculation(calculationId);

            if (!calculation) {
                this.logger.warn(`Cálculo com ID ${calculationId} não encontrado`);
                return null;
            }

            const updatedCalculation = await this.dietService.updateDietCalculation(calculationId, {
                statusPhase: phase
            });

            this.logger.log(`Fase do cálculo atualizada para ${phase}: ${JSON.stringify(updatedCalculation, null, 2)}`);

            return updatedCalculation;
        } catch (error) {
            this.logger.error(`Erro ao atualizar fase do cálculo: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Processa um job de planejamento de refeições (Fase 2)
     */
    async processMealPlanning(job: Job<MealPlanningData>): Promise<void> {
        const { userId, jobId, calculationId, mealsPerDay } = job.data;
        this.logger.log(`Processing meal planning for user ${userId}, jobId ${jobId}, calculationId ${calculationId}, mealsPerDay ${mealsPerDay}`);

        try {
            // Verificar se o cálculo existe e pertence ao usuário
            const calculation = await this.dietService.getDietCalculation(calculationId);

            if (!calculation) {
                throw new Error(`Cálculo ${calculationId} não encontrado`);
            }

            // Fallback: Se não houver planos, gerar planos padrão
            if (!calculation.plans || calculation.plans.length === 0) {
                this.logger.warn(`Nenhum plano encontrado para o cálculo ${calculationId}. Gerando planos padrão.`);

                // Lógica para gerar planos padrão
                const defaultPlans = [
                    {
                        name: 'Plano Padrão',
                        totalCalories: Math.round(calculation.ger),
                        application: 'Dia normal'
                    },
                    {
                        name: 'Dias de Treino',
                        totalCalories: Math.round(calculation.ger * 1.2),
                        application: 'Dias com atividade física intensa'
                    }
                ];

                // Salvar planos
                const savedPlans = await Promise.all(
                    defaultPlans.map(plan =>
                        this.dietService.createDietPlan({
                            userId,
                            jobId,
                            calculationId,
                            name: plan.name,
                            totalCalories: plan.totalCalories,
                            application: plan.application
                        })
                    )
                );

                this.logger.log(`Planos padrão gerados: ${JSON.stringify(savedPlans, null, 2)}`);
            }

            // Atualizar o job e o cálculo
            await this.dietService.updateDietJob(jobId, {
                status: DietJobStatusEnum.COMPLETED,
                progress: 100,
                resultData: {
                    ...job.data,
                    plansGenerated: calculation.plans.length
                }
            });

            await this.updateCalculationPhase(calculationId, DietProcessPhase.MEAL_PLANNING);

        } catch (error) {
            this.logger.error(`Erro no processamento do planejamento de refeições: ${error.message}`, error.stack);

            // Atualizar job com status de falha
            await this.dietService.updateDietJob(jobId, {
                status: DietJobStatusEnum.FAILED,
                errorLogs: error.message
            });

            throw error;
        }
    }

    /**
     * Enfileira um job para detalhamento de alimentos (Fase 3)
     */
    async queueFoodDetailing(
        userId: number,
        jobId: string,
        planId: string,
        mealId: string
    ): Promise<Job<FoodDetailingData>> {
        this.logger.log(`Queueing food detailing for user ${userId}, jobId ${jobId}, planId ${planId}, mealId ${mealId}`);

        const jobData: FoodDetailingData = {
            userId,
            jobId,
            planId,
            mealId
        };

        // Adicionar à fila Bull
        const job = await this.dietQueue.add('food-detailing', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
            priority: 10, // Maior prioridade para detalhamento de alimentos
        });

        this.logger.log(`Added job ${job.id} to queue`);
        return job;
    }

    /**
     * Processa um job de detalhamento de alimentos (Fase 3)
     */
    async processFoodDetailing(job: Job<FoodDetailingData>): Promise<void> {
        const { userId, jobId, planId, mealId } = job.data;
        this.logger.log(`Processing food detailing for user ${userId}, jobId ${jobId}, planId ${planId}, mealId ${mealId}`);

        try {
            // Atualizar progresso inicial
            await job.progress(10);

            // 1. Obter dados necessários
            // Obter o plano de dieta
            const plan = await this.dietService.getDietPlan(planId);

            // Verificar se o plano pertence ao usuário
            if (plan.userId !== userId) {
                throw new Error(`Plan ${planId} does not belong to user ${userId}`);
            }

            // Obter a refeição específica
            const meal = plan.meals?.find(m => m.id === mealId);
            if (!meal) {
                throw new Error(`Meal ${mealId} not found in plan ${planId}`);
            }

            // Atualizar progresso
            await job.progress(20);

            // 2. Obter preferências alimentares do usuário
            const foodPreferences = await this.nutritionService.getUserFoodPreferences(userId);

            // 3. Obter dados biométricos para contexto
            let biometrics;
            try {
                biometrics = await this.nutritionService.getUserBiometrics(userId);
            } catch (error) {
                this.logger.warn(`Biometrics not found for user ${userId}, proceeding without them`);
            }

            // Atualizar progresso
            await job.progress(30);

            // 4. Determinar a posição da refeição no plano
            const mealPosition = plan.meals?.findIndex(m => m.id === mealId) + 1 || 1;
            const totalMeals = plan.meals?.length || 1;

            // 5. Determinar o tipo de dieta com base no objetivo do usuário
            let dietType = 'balanced';
            try {
                const nutrition = await this.nutritionService.getUserNutritionGoal(userId);
                if (nutrition) {
                    // Mapear o objetivo para um tipo de dieta
                    switch (nutrition.goalType) {
                        case DietGoalType.WEIGHT_LOSS:
                            dietType = nutrition.calorieAdjustment <= -15 ? 'low-carb' : 'balanced';
                            break;
                        case DietGoalType.WEIGHT_GAIN:
                            dietType = 'high-protein';
                            break;
                        default:
                            dietType = 'balanced';
                    }
                }
            } catch (error) {
                this.logger.warn(`Nutrition goal not found for user ${userId}, using balanced diet type`);
            }

            // Atualizar progresso
            await job.progress(40);

            // 6. Preparar informações para o prompt
            // Formatar as preferências alimentares para o prompt
            const preferencesText = foodPreferences.map(pref =>
                `${pref.type === FoodPreferenceType.PREFERENCE ? "Preferência" :
                    pref.type === FoodPreferenceType.RESTRICTION ? "Restrição" :
                        "Alergia"}: ${pref.description}`
            ).join('\n');

            // 7. Gerar prompt para o modelo de IA
            const prompt = this.dietService.generateFoodDetailingPrompt(
                meal,
                foodPreferences,
                mealPosition,
                totalMeals,
                dietType,
                biometrics
            );

            // Atualizar progresso
            await job.progress(50);

            // 8. Chamar a API de IA para obter o detalhamento
            const aiService = this.aiServiceFactory.getServiceWithFallback();
            const response = await aiService.generateJsonCompletion<MealDetailsDto>(prompt);

            if (!response || !response.content) {
                throw new Error('Failed to generate meal details from AI');
            }

            // Validar a resposta da IA
            this.validateMealDetailsResponse(response.content, meal);

            // Atualizar progresso
            await job.progress(70);

            // 9. Salvar os detalhes dos alimentos no banco de dados
            await this.dietService.saveMealDetails(mealId, response.content);

            // 10. Atualizar o job como concluído
            await job.progress(90);

            // 11. Verificar se todas as refeições do plano estão detalhadas
            const allMealsDetailed = await this.checkAllMealsDetailed(plan);

            // 12. Se todas as refeições estiverem detalhadas, atualizar o status do cálculo
            if (allMealsDetailed) {
                const calculation = await this.dietService.getDietCalculation(plan.calculationId);
                await this.dietService.updateDietCalculation(calculation.id, {
                    statusPhase: DietProcessPhase.FOOD_DETAILING
                });

                // Atualizar o job principal
                await this.dietService.updateDietJob(jobId, {
                    status: DietJobStatusEnum.COMPLETED,
                    progress: 100,
                    resultData: {
                        ...job.data,
                        calculationId: plan.calculationId,
                        completed: true
                    }
                });
            }

            // Atualizar progresso final
            await job.progress(100);
            this.logger.log(`Food detailing completed successfully for meal ${mealId}`);

        } catch (error) {
            this.logger.error(`Error processing food detailing: ${error.message}`, error.stack);

            // Atualizar job com status de falha
            try {
                await this.dietService.updateDietJob(jobId, {
                    status: DietJobStatusEnum.FAILED,
                    errorLogs: `Error detailing foods: ${error.message}`
                });
            } catch (updateError) {
                this.logger.error(`Failed to update job status: ${updateError.message}`);
            }

            throw error;
        }
    }

    /**
     * Valida a resposta da IA para o detalhamento da refeição
     */
    private validateMealDetailsResponse(response: MealDetailsDto, originalMeal: DietMeal): void {
        // Verificar se a resposta contém os campos necessários
        if (!response.foods || response.foods.length === 0) {
            throw new Error('AI response does not contain any foods');
        }

        // Verificar se os macronutrientes estão próximos aos valores originais
        // Permitir uma margem de erro de 5%
        const proteinDiff = Math.abs(response.macronutrients.protein - originalMeal.protein);
        const carbsDiff = Math.abs(response.macronutrients.carbs - originalMeal.carbs);
        const fatDiff = Math.abs(response.macronutrients.fat - originalMeal.fat);

        const proteinTolerance = originalMeal.protein * 0.05;
        const carbsTolerance = originalMeal.carbs * 0.05;
        const fatTolerance = originalMeal.fat * 0.05;

        if (proteinDiff > proteinTolerance || carbsDiff > carbsTolerance || fatDiff > fatTolerance) {
            this.logger.warn(`AI response macronutrients differ from original meal by more than 5%:`);
            this.logger.warn(`Original: P:${originalMeal.protein}, C:${originalMeal.carbs}, F:${originalMeal.fat}`);
            this.logger.warn(`Response: P:${response.macronutrients.protein}, C:${response.macronutrients.carbs}, F:${response.macronutrients.fat}`);
            // Ajustamos os macronutrientes para corresponder aos originais
            response.macronutrients.protein = originalMeal.protein;
            response.macronutrients.carbs = originalMeal.carbs;
            response.macronutrients.fat = originalMeal.fat;
        }
    }

    /**
     * Verifica se todas as refeições do plano estão detalhadas
     */
    private async checkAllMealsDetailed(plan: DietPlan): Promise<boolean> {
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
}