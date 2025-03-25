import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DietGenerationJob, DietJobStatusEnum } from '../entities/diet-generation-job.entity';
import { DietPlan } from '../entities/diet-plan.entity';
import { DietCalculation } from '../entities/diet-calculation.entity';
import { DietCalculationFormula } from '../entities/diet-calculation-formula.entity';
import { DietCalculationMet } from '../entities/diet-calculation-met.entity';
import { MetReference } from '../entities/met-reference.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { AIServiceFactory } from '../../../shared/factories/ai-service.factory';
import {CreateDietCalculationDto, MacronutrientsDto, MealDetailsDto} from '../dto';
import { DietGoalType } from '../entities/user-nutrition-goal.entity';
import {
    DietMeal,
    DietMealAlternative,
    DietMealAlternativeFood,
    DietMealFood, FoodPreferenceType,
    UserBiometrics,
    UserFoodPreference
} from "../entities";
import {NutritionService} from "./nutrition.service";
import {DietProcessPhase} from "../../diet/services/diet-processor.service";
import {DietPlanGenerationDto} from "../dto/diet-macronutrients.dto";

@Injectable()
export class DietService {
    private readonly logger = new Logger(DietService.name);

    constructor(
        @InjectRepository(DietGenerationJob)
        private dietJobRepository: Repository<DietGenerationJob>,

        @InjectRepository(DietPlan)
        private dietPlanRepository: Repository<DietPlan>,

        @InjectRepository(DietCalculation)
        private dietCalculationRepository: Repository<DietCalculation>,

        @InjectRepository(DietCalculationFormula)
        private dietCalculationFormulaRepository: Repository<DietCalculationFormula>,

        @InjectRepository(DietCalculationMet)
        private dietCalculationMetRepository: Repository<DietCalculationMet>,

        @InjectRepository(MetReference)
        private metReferenceRepository: Repository<MetReference>,

        private dataSource: DataSource,
        private aiServiceFactory: AIServiceFactory,
        private nutritionService: NutritionService
    ) {}

    // Métodos existentes para DietGenerationJob
    async createDietJob(userId: number, jobType: string, inputData: Record<string, any>): Promise<DietGenerationJob> {
        const job = this.dietJobRepository.create({
            userId,
            jobType,
            inputData,
            status: DietJobStatusEnum.PENDING,
            progress: 0
        });
        return this.dietJobRepository.save(job);
    }

    async getDietJob(jobId: string): Promise<DietGenerationJob> {
        const job = await this.dietJobRepository.findOne({
            where: { id: jobId },
            relations: ['dietPlans']
        });

        if (!job) {
            throw new NotFoundException(`Diet job with ID "${jobId}" not found`);
        }

        return job;
    }

    async updateDietJob(jobId: string, updateData: Partial<DietGenerationJob>): Promise<DietGenerationJob> {
        try {
            this.logger.log(`Atualizando job ${jobId} com dados: ${JSON.stringify(updateData, null, 2)}`);

            // Validar dados de atualização
            if (!updateData) {
                throw new Error('Dados de atualização não podem ser nulos');
            }

            // Atualizar job
            await this.dietJobRepository.update(jobId, updateData);

            // Buscar job atualizado para confirmar
            const updatedJob = await this.getDietJob(jobId);

            this.logger.log(`Job ${jobId} atualizado: ${JSON.stringify(updatedJob, null, 2)}`);

            return updatedJob;
        } catch (error) {
            this.logger.error(`Erro ao atualizar job ${jobId}: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Métodos existentes para DietPlan
    async createDietPlan(planData: Partial<DietPlan>): Promise<DietPlan> {
        const plan = this.dietPlanRepository.create(planData);
        return this.dietPlanRepository.save(plan);
    }

    async getUserDietPlans(userId: number): Promise<DietPlan[]> {
        return this.dietPlanRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' }
        });
    }

    async getDietPlan(planId: string): Promise<DietPlan> {
        const plan = await this.dietPlanRepository.findOne({
            where: { id: planId },
            relations: ['calculation', 'meals', 'meals.foods', 'meals.alternatives', 'meals.alternatives.foods']
        });

        if (!plan) {
            throw new NotFoundException(`Diet plan with ID "${planId}" not found`);
        }

        return plan;
    }

    async getUserDietJobs(userId: number): Promise<DietGenerationJob[]> {
        return this.dietJobRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            relations: ['dietPlans']
        });
    }

    // Novos métodos para o sistema de três fases

    /**
     * Processa a Fase 1 do cálculo de dieta (cálculo metabólico)
     */
    async processMetabolicCalculationJob(jobId: string): Promise<void> {
        const job = await this.getDietJob(jobId);

        try {
            // Atualizar status para processando
            await this.updateDietJob(jobId, {
                status: DietJobStatusEnum.PROCESSING,
                progress: 10
            });

            // Validar dados de entrada
            if (!job.inputData || !job.inputData.biometrics) {
                throw new BadRequestException('Biometric data is required for metabolic calculation');
            }

            // Obter os dados necessários para o cálculo
            const { biometrics, goal, activities, dailyActivity } = job.inputData;

            // Preparar dados para o prompt
            const person = {
                weight: biometrics.weight,
                height: biometrics.height,
                age: biometrics.age,
                gender: biometrics.gender,
                leanMass: biometrics.leanMass,
                goal: this.mapGoalTypeToPromptFormat(goal?.goalType || DietGoalType.WEIGHT_LOSS),
                adjust: goal?.calorieAdjustment || 0
            };

            // Formatar atividades para o prompt
            const formattedDailyActivity = this.formatActivitiesForPrompt(dailyActivity, activities);

            // Gerar prompt para o cálculo metabólico
            const prompt = this.generateMetabolicCalculationPrompt(person, formattedDailyActivity);

            // Chamar API de IA
            await this.updateDietJob(jobId, { progress: 30 });
            const aiService = this.aiServiceFactory.getServiceWithFallback();
            const response = await aiService.generateJsonCompletion(prompt);

            // Processar a resposta
            await this.updateDietJob(jobId, { progress: 60 });
            const result = this.validateAndTransformAIResponse(response.content);

            // Salvar os resultados no banco de dados usando transaction
            await this.updateDietJob(jobId, { progress: 80 });
            const calculation = await this.saveDietCalculation(job.userId, job.id, result);

            // Atualizar job com os resultados
            await this.updateDietJob(jobId, {
                status: DietJobStatusEnum.COMPLETED,
                progress: 100,
                resultData: {
                    calculationId: calculation.id,
                    tmb: calculation.tmb,
                    ger: calculation.ger,
                    plans: calculation.plans.map(plan => ({
                        id: plan.id,
                        name: plan.name,
                        totalCalories: plan.totalCalories
                    }))
                }
            });

        } catch (error) {
            this.logger.error(`Error processing metabolic calculation job: ${error.message}`, error.stack);

            // Em caso de erro, atualizar o status e registrar o erro
            await this.updateDietJob(jobId, {
                status: DietJobStatusEnum.FAILED,
                errorLogs: error.message || 'Unknown error occurred during metabolic calculation'
            });

            throw error;
        }
    }

    /**
     * Formata as atividades do usuário para o prompt de IA
     */
    private formatActivitiesForPrompt(dailyActivityText: string, activities: UserActivity[]): string {
        // Se o texto de atividade diária já foi fornecido, usá-lo
        if (dailyActivityText) {
            return dailyActivityText;
        }

        // Caso contrário, formatar a partir das atividades do usuário
        if (!activities || activities.length === 0) {
            return 'Sedentário, sem atividades físicas regulares.';
        }

        return activities.map(activity => {
            const metDescription = activity.metReference ?
                activity.metReference.description :
                `Atividade com MET ${activity.metCode}`;

            return `${metDescription}: ${activity.durationMinutes} minutos, ${activity.frequencyPerWeek} vezes por semana`;
        }).join('\n');
    }

    /**
     * Mapeia o tipo de objetivo para o formato esperado pelo prompt
     */
    private mapGoalTypeToPromptFormat(goalType: DietGoalType): string {
        switch (goalType) {
            case DietGoalType.WEIGHT_LOSS:
                return 'weightLoss';
            case DietGoalType.WEIGHT_GAIN:
                return 'weightGain';
            case DietGoalType.MAINTENANCE:
            default:
                return 'maintenance';
        }
    }

    /**
     * Gera o prompt aprimorado para o cálculo metabólico
     */
    private generateMetabolicCalculationPrompt(person: any, dailyActivity: string): string {
        // Mapear os objetivos para aliases mais detalhados
        const goalAlias = [
            {
                goal: 'maintenance',
                label: 'manutenção de peso e massa muscular',
                strategies: [
                    `Proteínas entre 1,4–1,8 g/kg/dia`,
                    `Gorduras entre 20–30% das calorias`,
                    `Distribua a proteina pelo total de refeições mas considerando o peso da refeição. Ex: mais proteínas no almoço e jantar.`
                ]
            },
            {
                goal: 'weightLoss',
                label: 'perda de peso com manutenção de massa muscular',
                strategies: [
                    `Priorize proteína (1,6–2,2 g/kg/dia)`,
                    `Gorduras entre 20–30% das calorias`,
                    `Distribua a proteina pelo total de refeições mas considerando o peso da refeição. Ex: mais proteínas no almoço e jantar.`
                ]
            },
            {
                goal: 'weightGain',
                label: 'Ganho de peso com baixo ganho de gordura',
                strategies: [
                    `Proteínas entre 1,6–2,2 g/kg/dia`,
                    `Gorduras entre 20–25% das calorias`,
                    `Distribua a proteina pelo total de refeições mas considerando o peso da refeição. Ex: mais proteínas no almoço e jantar.`
                ]
            },
        ].find(f => f.goal === person.goal);

        return `
    # Função e objetivo  
    Você é um especialista em cálculos nutricionais, com foco exclusivo na determinação precisa das necessidades calóricas individuais.
    
    # Diretrizes  
     - Domínio completo das principais equações de gasto energético:
    \t-   Harris-Benedict
    \t-   Mifflin-St Jeor
    \t-   Owen
    \t-   FAO/WHO/UNU
    \t-   Cunningham
    \t-   Katch-McArdle
    - Capacidade de calcular com precisão:
    \t- TMB (Taxa metabólica basal)
    \t- GER (Gasto energético em repouso)
    \t- GET (Gasto energético total)
    - Competência para:
    \t- Ajustar cálculos baseados em fatores individuais como composição corporal, massa magra, idade e restrições específicas de saúde.
    \t- Aplicar fatores de atividade física adequados.
    \t- Adaptar cálculos para diferentes objetivos (perda de peso, ganho muscular, manutenção).
    
    # Passos
    1. Calcule a TMB usando a fórmula mais apropriada para o perfil do usuário:
       - Se disponível a massa magra, priorize Katch-McArdle ou Cunningham
       - Caso contrário, escolha entre Mifflin-St Jeor (recomendada), Harris-Benedict ou Owen
    
    2. Avalie o nível de atividade física e determine o fator correspondente:
       - Sedentário (1.2): Pouca ou nenhuma atividade física
       - Levemente ativo (1.375): Exercício leve 1-3 dias/semana
       - Moderadamente ativo (1.55): Exercício moderado 3-5 dias/semana
       - Muito ativo (1.725): Exercício pesado 6-7 dias/semana
       - Extremamente ativo (1.9): Exercício pesado diário ou treino físico 2x/dia
    
    3. Identifique e classifique cada atividade física relatada com seu código MET específico e calcule a contribuição por semana (MET * minutos * frequência semanal)
    
    4. Calcule o GET (Gasto Energético Total) multiplicando a TMB pelo fator de atividade, OU incorporando os valores MET específicos se disponíveis
    
    5. Ajuste as calorias baseadas no objetivo:
       - Perda de peso: redução de ${person.adjust < 0 ? Math.abs(person.adjust) : 20}% das calorias
       - Manutenção: manter o GET calculado
       - Ganho de peso: aumento de ${person.adjust > 0 ? person.adjust : 10}% das calorias
    
    6. Caso o usuário tenha atividades específicas de alta intensidade (MET ≥ 6) em dias específicos da semana, crie um plano separado para esses dias com o ajuste calórico apropriado.
    
    # Inputs
    - Dados do usuário
        - Idade: ${person.age} anos
        - Peso: ${person.weight}kg
        - Altura: ${person.height}cm
        - Massa magra: ${person.leanMass ? person.leanMass + 'kg' : 'Não informada'}
        - Sexo: ${person.gender}
    
    - Relato de atividade
    ${dailyActivity}
    
    - Objetivo
        - ${goalAlias?.label}, com ajuste de ${Math.abs(person.adjust)}% (${person.adjust >= 0 ? 'aumento' : 'redução'} calórico).
    
    # Resposta
    Sua resposta deve ser apenas um objeto JSON válido e completo, sem explicações adicionais ou textos fora do objeto JSON. Siga exatamente esta estrutura:
    
    {
      "tmb": numero,
      "ger": numero,
      "activity_level": numero (opcional, apenas se não usar METs específicos),
      "mets": [
        {
          "met": "código ou descrição do MET",
          "factor": número com valor do fator
        }
      ],
      "objective_pct": número (positivo para superávit, negativo para déficit),
      "plans": [
        {
          "name": "Nome do plano em português (ex: 'Plano padrão', 'Dias de treino')",
          "GET": número,
          "total_calories": número,
          "application": "descrição de como aplicar este plano"
        }
      ],
      "tmb_formulas": [
        {
          "name": "nome da fórmula usada",
          "value": número com o resultado
        }
      ]
    }
    `;
    }

    /**
     * Valida e transforma a resposta da IA
     */
    private validateAndTransformAIResponse(aiResponse: any): CreateDietCalculationDto {
        try {
            // Validar campos obrigatórios
            if (!aiResponse.tmb || !aiResponse.ger || !aiResponse.plans || !aiResponse.plans.length) {
                throw new BadRequestException('Invalid AI response: missing required fields');
            }

            // Transformar para o formato do DTO
            const result: CreateDietCalculationDto = {
                tmb: parseFloat(aiResponse.tmb),
                ger: parseFloat(aiResponse.ger),
                objectivePct: parseFloat(aiResponse.objective_pct || '0'),
                plans: [],
                formulas: [],
                mets: []
            };

            // Adicionar o nível de atividade se fornecido
            if (aiResponse.activity_level) {
                result.activityLevel = parseFloat(aiResponse.activity_level);
            }

            // Transformar planos
            if (aiResponse.plans && Array.isArray(aiResponse.plans)) {
                result.plans = aiResponse.plans.map(plan => ({
                    name: plan.name,
                    get: parseFloat(plan.GET || '0'),
                    totalCalories: parseFloat(plan.total_calories),
                    application: plan.application
                }));
            }

            // Transformar fórmulas
            if (aiResponse.tmb_formulas && Array.isArray(aiResponse.tmb_formulas)) {
                result.formulas = aiResponse.tmb_formulas.map(formula => ({
                    name: formula.name,
                    value: 0 // O valor será preenchido posteriormente, quando tivermos as fórmulas específicas
                }));
            }

            // Transformar METs
            if (aiResponse.mets && Array.isArray(aiResponse.mets)) {
                result.mets = aiResponse.mets.map(met => ({
                    met: met.met,
                    factor: parseFloat(met.factor),
                    frequencyPerWeek: 1, // Valor padrão
                    durationMinutes: 60 // Valor padrão
                }));
            }

            return result;
        } catch (error) {
            this.logger.error(`Error validating AI response: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to process AI response: ${error.message}`);
        }
    }

    /**
     * Salva os dados de cálculo de dieta no banco de dados
     */
    async saveDietCalculation(userId: number, jobId: string, data: CreateDietCalculationDto): Promise<DietCalculation> {
        // Usar uma transaction para garantir que todos os dados sejam salvos ou nenhum
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Criar o registro de cálculo
            const calculation = queryRunner.manager.create(DietCalculation, {
                userId,
                jobId,
                tmb: data.tmb,
                ger: data.ger,
                activityLevel: data.activityLevel,
                objectivePct: data.objectivePct,
                statusPhase: 1 // Primeira fase
            });

            const savedCalculation = await queryRunner.manager.save(calculation);

            // 2. Salvar fórmulas se existirem
            if (data.formulas && data.formulas.length > 0) {
                const formulaEntities = data.formulas.map(formula =>
                    queryRunner.manager.create(DietCalculationFormula, {
                        calculationId: savedCalculation.id,
                        formulaName: formula.name,
                        formulaValue: formula.value
                    })
                );
                await queryRunner.manager.save(formulaEntities);
            }

            // 3. Salvar METs se existirem
            if (data.mets && data.mets.length > 0) {
                // Obter todos os códigos MET válidos
                const metCodes = await this.metReferenceRepository.find();
                const validMetCodes = metCodes.map(met => met.code);

                // Criar um array para os metEntities
                const metEntities: DietCalculationMet[] = [];

                for (const met of data.mets) {
                    // Verificar se o código MET existe ou tentar encontrar o mais próximo
                    let metCode = met.met;
                    if (!validMetCodes.includes(metCode)) {
                        metCode = await this.findBestMatchingMetCode(met.met, validMetCodes) || metCode;
                    }

                    metEntities.push(
                        queryRunner.manager.create(DietCalculationMet, {
                            calculationId: savedCalculation.id,
                            metCode,
                            metFactor: met.factor,
                            frequencyPerWeek: met.frequencyPerWeek || 1,
                            durationMinutes: met.durationMinutes || 60
                        })
                    );
                }

                if (metEntities.length > 0) {
                    await queryRunner.manager.save(DietCalculationMet, metEntities);
                }
            }

            // 4. Salvar planos de dieta
            if (data.plans && data.plans.length > 0) {
                const planEntities = data.plans.map(plan => {
                    // Calcular macronutrientes baseados nas calorias totais e peso
                    // Estes valores são apenas aproximações iniciais e serão refinados na fase 2
                    const totalCalories = plan.totalCalories;
                    const proteinPerKg = data.objectivePct > 0 ? 1.6 : (data.objectivePct < 0 ? 2.0 : 1.8); // Mais proteína para perda de peso

                    // Usuários em dieta de ganho têm mais carboidratos, menos para perda de peso
                    const fatPercentage = data.objectivePct > 0 ? 0.25 : (data.objectivePct < 0 ? 0.3 : 0.25);

                    // 4 kcal por grama de proteína/carboidrato, 9 kcal por grama de gordura
                    const proteinGrams = Math.round(1 * proteinPerKg);
                    const proteinCalories = proteinGrams * 4;

                    const fatCalories = totalCalories * fatPercentage;
                    const fatGrams = Math.round(fatCalories / 9);

                    const carbsCalories = totalCalories - proteinCalories - fatCalories;
                    const carbsGrams = Math.round(carbsCalories / 4);

                    return queryRunner.manager.create(DietPlan, {
                        userId,
                        jobId,
                        calculationId: savedCalculation.id,
                        name: plan.name,
                        get: plan.get,
                        tmb: data.tmb,
                        met: 0, // Será calculado na próxima fase
                        getd: plan.get, // Inicialmente igual ao GET
                        activityLevel: data.activityLevel,
                        totalCalories: Math.round(Number(plan.totalCalories)),
                        protein: proteinGrams,
                        carbs: carbsGrams,
                        fat: fatGrams,
                        application: plan.application,
                        isActive: true
                    });
                });

                const savedPlans = await queryRunner.manager.save(planEntities);
                savedCalculation.plans = savedPlans;
            }

            // Commit da transaction
            await queryRunner.commitTransaction();
            return savedCalculation;

        } catch (error) {
            // Rollback em caso de erro
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error saving diet calculation: ${error.message}`, error.stack);
            throw error;
        } finally {
            // Liberar o queryRunner
            await queryRunner.release();
        }
    }

    /**
     * Tenta encontrar o código MET mais próximo na lista de códigos válidos
     */
    private async findBestMatchingMetCode(metDescription: string, validMetCodes: string[]): Promise<string | null> {
        try {
            // Normalizar o texto para comparação
            const normalizedDescription = metDescription.toLowerCase().trim();

            // Tentar encontrar uma correspondência exata
            const metReferences = await this.metReferenceRepository.find();

            // Primeiro, tentar uma correspondência exata na descrição
            const exactMatch = metReferences.find(
                ref => ref.description.toLowerCase() === normalizedDescription
            );

            if (exactMatch) {
                return exactMatch.code;
            }

            // Segundo, tentar uma correspondência parcial
            const partialMatch = metReferences.find(
                ref => ref.description.toLowerCase().includes(normalizedDescription) ||
                    normalizedDescription.includes(ref.description.toLowerCase())
            );

            if (partialMatch) {
                return partialMatch.code;
            }

            // Se não encontrar, retornar um código padrão com base na categoria ou faixa MET
            // Aqui poderiamos implementar uma lógica mais sofisticada no futuro
            return metReferences.length > 0 ? metReferences[0].code : null;

        } catch (error) {
            this.logger.error(`Error finding matching MET code: ${error.message}`);
            return null;
        }
    }

    // Adicione estes métodos à classe DietService

    /**
     * Obtém um cálculo de dieta pelo ID
     */
    async getDietCalculation(calculationId: string): Promise<DietCalculation> {
        const calculation = await this.dietCalculationRepository.findOne({
            where: { id: calculationId },
            relations: ['formulas', 'mets', 'plans']
        });

        if (!calculation) {
            throw new NotFoundException(`Diet calculation with ID "${calculationId}" not found`);
        }

        return calculation;
    }

    /**
     * Atualiza um cálculo de dieta
     */
    async updateDietCalculation(calculationId: string, updateData: Partial<DietCalculation>): Promise<DietCalculation> {
        await this.dietCalculationRepository.update(calculationId, updateData);
        return this.getDietCalculation(calculationId);
    }

    /**
     * Obtém todos os cálculos de dieta de um usuário
     */
    async getUserDietCalculations(userId: number): Promise<DietCalculation[]> {
        return this.dietCalculationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Processa o trabalho de planejamento de refeições (Fase 2)
     */
    async processMealPlanning(
        jobId: string,
        calculationId: string,
        mealsPerDay: number
    ): Promise<void> {
        try {
            // Obter o cálculo existente
            const calculation = await this.getDietCalculation(calculationId);

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

            // Gerar prompt
            const prompt = this.generateMealPlanningPrompt(planPromptData, mealsPerDay);

            // Chamar serviço de IA
            const aiService = this.aiServiceFactory.getServiceWithFallback();
            const response = await aiService.generateJsonCompletion<DietPlanGenerationDto>(prompt);

            // Processar e salvar resposta
            await this.saveMealPlans(
                jobId,     // Adicionando jobId
                calculationId,  // Adicionando calculationId
                response.content  // Dados da resposta da IA
            );

        } catch (error) {
            // Tratamento de erro
            this.logger.error(`Erro no planejamento de refeições: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gera o prompt para o planejamento de refeições (Fase 2)
     */
    generateMealPlanningPrompt(plans: any[], mealAmount: number): string {
        let prompt = `
    # Função e objetivo  
    Você é um especialista em análise e distribuição alimentar, com foco exclusivo na determinação precisa das necessidades individuais.
    
    # Diretrizes 
    - Definir os planos alimentares bem como as refeições de cada plano
    - Distribuir os macronutrientes no contexto de cada refeição
    
    # Passos
    - Calcule os macronutrientes a partir da quantidade de calorias especificadas.
    - Utilize as melhores práticas para definir a melhor estratégia nutricional para o indivíduo.
    - Quando informado uma quantidade de calorias específicas para situações variadas você deve gerar um plano para cada quantidade de calorias.
    - Gere exatamente a quantidade de refeições indicadas pelo usuário.
    - Leve em consideração cada refeição e o objetivo do usuário para definir a quantidade dos macronutrientes.
    - A soma dos macronutrientes de cada refeição deve ser exatamente os macronutrientes de cada plano.
    
    # Inputs
    - Calorias`;

        plans.forEach(plan => {
            prompt += `\n      - ${plan.name}: ${plan.totalCalories}, ${plan.application}`;
        })

        prompt += `\n- Plano alimentar\n      - ${mealAmount} Refeições diárias
    
    # Resposta
    - O formato deverá ser obrigatoriamente em JSON
    - Evite caracteres adicionais alheios ao formato json
    - Sua resposta deve conter APENAS o objeto JSON a seguir, sem texto explicativo antes ou depois
    - O formato do objeto de saída deve seguir exatamente este modelo:
    {"plans":[{"name":"string","totalCalories":"number","application":"string","macronutrients":{"protein":"number","fat":"number","carbs":"number"},"meals":[{"name":"string","macronutrients":{"protein":"number","fat":"number","carbs":"number"}}]}]}
    `;

        return prompt;
    }

    /**
     * Valida e transforma a resposta da IA para o planejamento de refeições
     */
    private validateAndTransformMealPlanningResponse(response: any): any {
        // Implementar validação e transformação da resposta
        if (!response.plans || !Array.isArray(response.plans)) {
            throw new BadRequestException('Invalid AI response: missing plans array');
        }

        return response;
    }

    /**
     * Salva os planos de refeições no banco de dados
     */
    async saveMealPlans(
        jobId: string,
        calculationId: string,
        planData: DietPlanGenerationDto
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obter o cálculo existente
            const calculation = await this.getDietCalculation(calculationId);

            for (const planInput of planData.plans) {
                // Encontrar o plano correspondente
                const existingPlan = calculation.plans.find(p => p.name === planInput.name);

                if (existingPlan) {
                    // Atualizar plano com macronutrientes
                    existingPlan.protein = planInput.macronutrients.protein;
                    existingPlan.carbs = planInput.macronutrients.carbs;
                    existingPlan.fat = planInput.macronutrients.fat;

                    await queryRunner.manager.save(existingPlan);

                    // Criar refeições para este plano
                    if (planInput.meals) {
                        for (let i = 0; i < planInput.meals.length; i++) {
                            const mealData = planInput.meals[i];

                            const meal = queryRunner.manager.create(DietMeal, {
                                planId: existingPlan.id,
                                name: mealData.name,
                                sortOrder: i + 1,
                                protein: mealData.macronutrients.protein,
                                carbs: mealData.macronutrients.carbs,
                                fat: mealData.macronutrients.fat,
                                calories: this.calculateMealCalories(mealData.macronutrients)
                            });

                            await queryRunner.manager.save(meal);
                        }
                    }
                }
            }

            // Atualizar status do job e cálculo
            await this.updateDietJob(jobId, {
                status: DietJobStatusEnum.COMPLETED,
                progress: 100,
                resultData: {
                    calculationId,
                    plansGenerated: planData.plans.length
                }
            });

            await this.updateDietCalculation(calculationId, {
                statusPhase: DietProcessPhase.MEAL_PLANNING
            });

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Erro ao salvar planos de refeições: ${error.message}`, error.stack);

            // Atualizar job com status de falha
            await this.updateDietJob(jobId, {
                status: DietJobStatusEnum.FAILED,
                errorLogs: error.message
            });

            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private calculateMealCalories(macronutrients: MacronutrientsDto): number {
        // Calcular calorias baseado nos macronutrientes
        // 4 kcal por grama de proteína/carboidrato, 9 kcal por grama de gordura
        return Math.round(
            (macronutrients.protein * 4) +
            (macronutrients.carbs * 4) +
            (macronutrients.fat * 9)
        );
    }

    async saveMealDetails(
        mealId: string,
        mealDetails: MealDetailsDto
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Atualizar macronutrientes da refeição
            await queryRunner.manager.update(DietMeal, mealId, {
                protein: mealDetails.macronutrients.protein,
                carbs: mealDetails.macronutrients.carbs,
                fat: mealDetails.macronutrients.fat,
                howTo: mealDetails.howTo
            });

            // Salvar alimentos da refeição
            const mealFoods = mealDetails.foods.map((food, index) =>
                queryRunner.manager.create(DietMealFood, {
                    mealId,
                    name: food.name,
                    grams: food.grams,
                    protein: food.macronutrients.protein,
                    carbs: food.macronutrients.carbs,
                    fat: food.macronutrients.fat,
                    calories: this.calculateFoodCalories(food.macronutrients),
                    sortOrder: index + 1
                })
            );
            await queryRunner.manager.save(mealFoods);

            // Salvar alternativas, se existirem
            if (mealDetails.alternatives && mealDetails.alternatives.length > 0) {
                const mealAlternatives = mealDetails.alternatives.map((alt, altIndex) => {
                    const alternative = queryRunner.manager.create(DietMealAlternative, {
                        originalMealId: mealId,
                        name: `Alternativa ${altIndex + 1}`,
                        protein: alt.macronutrients.protein,
                        carbs: alt.macronutrients.carbs,
                        fat: alt.macronutrients.fat,
                        calories: this.calculateAlternativeCalories(alt.macronutrients),
                        howTo: alt.howTo,
                        sortOrder: altIndex + 1
                    });

                    // Salvar alimentos da alternativa
                    const alternativeFoods = alt.foods.map((food, foodIndex) =>
                        queryRunner.manager.create(DietMealAlternativeFood, {
                            alternativeId: alternative.id,
                            name: food.name,
                            grams: food.grams,
                            protein: food.macronutrients.protein,
                            carbs: food.macronutrients.carbs,
                            fat: food.macronutrients.fat,
                            calories: this.calculateFoodCalories(food.macronutrients),
                            sortOrder: foodIndex + 1
                        })
                    );

                    return { alternative, foods: alternativeFoods };
                });

                // Salvar alternativas e seus alimentos
                for (const { alternative, foods } of mealAlternatives) {
                    const savedAlternative = await queryRunner.manager.save(alternative);
                    await queryRunner.manager.save(foods.map(food => ({
                        ...food,
                        alternativeId: savedAlternative.id
                    })));
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Erro ao salvar detalhes da refeição: ${error.message}`, error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private calculateFoodCalories(macronutrients: MacronutrientsDto): number {
        return Math.round(
            (macronutrients.protein * 4) +
            (macronutrients.carbs * 4) +
            (macronutrients.fat * 9)
        );
    }

    private calculateAlternativeCalories(macronutrients: MacronutrientsDto): number {
        return this.calculateFoodCalories(macronutrients);
    }

    /**
     * Gera o prompt para o detalhamento de alimentos de uma refeição (Fase 3)
     * sem incluir a geração de alternativas
     */
    /**
     * Gera o prompt para o detalhamento de alimentos de uma refeição (Fase 3)
     * priorizando as preferências alimentares do usuário
     */
    generateFoodDetailingPrompt(
        meal: DietMeal,
        userPreferences: UserFoodPreference[],
        mealPosition: number,
        totalMeals: number,
        dietType: string = 'balanced',
        biometrics?: UserBiometrics
    ): string {
        // Extrair preferências e restrições alimentares
        const preferences = userPreferences
            .filter(p => p.type === FoodPreferenceType.PREFERENCE)
            .map(p => p.description);

        const restrictions = userPreferences
            .filter(p => p.type === FoodPreferenceType.RESTRICTION)
            .map(p => p.description);

        const allergies = userPreferences
            .filter(p => p.type === FoodPreferenceType.ALLERGY)
            .map(p => p.description);

        // Formatar macronutrientes da refeição
        const macros = {
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            calories: meal.calories
        };

        // Determinar o tipo de refeição com base na posição
        const mealType = this.determineMealType(mealPosition, totalMeals);

        // Obter alimentos sugeridos com base no tipo de refeição
        const suggestedFoods = this.getSuggestedFoodsForMealType(mealType, dietType);

        // Obter diretrizes específicas para o tipo de dieta
        const dietGuidelines = this.getDietTypeGuidelines(dietType);

        // Obter recomendações de micronutrientes
        const micronutrientGuidelines = this.getMicronutrientGuidelines(mealType);

        // Texto condicional sobre preferências
        const preferencesGuidance = preferences.length > 0
            ? `- PRIORIZE EXCLUSIVAMENTE os alimentos listados nas preferências do usuário\n- Utilize apenas outros alimentos se as preferências não forem suficientes para compor a refeição completa`
            : `- Utilize os alimentos sugeridos como base, mas sinta-se livre para incluir outras opções saudáveis`;

        return `
# Função e objetivo
Você é um nutricionista especializado em detalhamento de refeições personalizadas, com foco em distribuição ideal de macro e micronutrientes.

# Diretrizes
- Detalhar com precisão os alimentos e quantidades para uma refeição específica
- Distribuir os macronutrientes definidos de forma equilibrada entre alimentos reais
- Priorizar alimentos integrais, frescos e minimamente processados
${preferencesGuidance}
- Respeitar RIGOROSAMENTE as restrições alimentares e alergias
- Para cada alimento, especificar a quantidade em gramas e seus valores nutricionais
- Balancear os micronutrientes relevantes para esta refeição
${dietGuidelines}

# Informações da refeição
- Nome: ${meal.name}
- Tipo: ${mealType} (${mealPosition}ª refeição de ${totalMeals})
- Proteínas: ${macros.protein}g
- Carboidratos: ${macros.carbs}g
- Gorduras: ${macros.fat}g
- Calorias totais: ${macros.calories}kcal

# Contexto do usuário
${biometrics ? `- Idade: ${biometrics.age} anos
- Peso: ${biometrics.weight}kg
- Altura: ${biometrics.height}cm
- Sexo: ${biometrics.gender}` : '- Informações biométricas não disponíveis'}

# Preferências alimentares (USE EXCLUSIVAMENTE ESTES ALIMENTOS, SE POSSÍVEL)
${preferences.length > 0 ? preferences.map(p => `- ${p}`).join('\n') : '- Não especificadas'}

# Restrições alimentares (NUNCA INCLUA ESTES ALIMENTOS)
${restrictions.length > 0 ? restrictions.map(r => `- ${r}`).join('\n') : '- Não especificadas'}

# Alergias (NUNCA INCLUA ESTES ALIMENTOS)
${allergies.length > 0 ? allergies.map(a => `- ${a}`).join('\n') : '- Não especificadas'}

${preferences.length === 0 ? `# Alimentos sugeridos (use apenas se necessário)
${suggestedFoods.map(f => `- ${f}`).join('\n')}` : ''}

# Micronutrientes importantes para esta refeição
${micronutrientGuidelines}

# Instruções
1. Forneça uma lista detalhada de 4-6 alimentos para esta refeição, com quantidades em gramas
2. IMPORTANTE: Use EXCLUSIVAMENTE alimentos listados nas preferências do usuário, a menos que não sejam suficientes
3. Para cada alimento, especifique os macronutrientes (proteínas, carboidratos, gorduras)
4. Inclua uma breve instrução de preparação da refeição em formato "passo a passo"
5. Garanta que o total de macronutrientes respeite exatamente os valores definidos

# Resposta
Forneça sua resposta APENAS no formato JSON a seguir, sem explicações ou texto adicional:

{
  "name": "Nome da refeição",
  "macronutrients": {
    "protein": 0,
    "carbs": 0,
    "fat": 0
  },
  "foods": [
    {
      "name": "Nome do alimento",
      "grams": 0,
      "macronutrients": {
        "protein": 0,
        "carbs": 0,
        "fat": 0
      }
    }
  ],
  "howTo": "Instruções de preparação"
}
`;
    }

    /**
     * Determina o tipo de refeição com base na posição e número total de refeições
     */
    private determineMealType(position: number, totalMeals: number): string {
        if (totalMeals <= 3) {
            // Esquema tradicional de 3 refeições
            if (position === 1) return 'Café da manhã';
            if (position === 2) return 'Almoço';
            if (position === 3) return 'Jantar';
        } else if (totalMeals === 4) {
            // Esquema com 4 refeições
            if (position === 1) return 'Café da manhã';
            if (position === 2) return 'Lanche da manhã';
            if (position === 3) return 'Almoço';
            if (position === 4) return 'Jantar';
        } else if (totalMeals === 5) {
            // Esquema com 5 refeições
            if (position === 1) return 'Café da manhã';
            if (position === 2) return 'Lanche da manhã';
            if (position === 3) return 'Almoço';
            if (position === 4) return 'Lanche da tarde';
            if (position === 5) return 'Jantar';
        } else {
            // Esquema com 6 ou mais refeições
            if (position === 1) return 'Café da manhã';
            if (position === 2) return 'Lanche da manhã';
            if (position === 3) return 'Almoço';
            if (position === 4) return 'Lanche da tarde';
            if (position === 5) return 'Jantar';
            if (position === 6) return 'Ceia';
            if (position > 6) return `Refeição extra ${position - 6}`;
        }

        return 'Refeição não categorizada';
    }

    /**
     * Retorna alimentos sugeridos para um tipo específico de refeição
     */
    private getSuggestedFoodsForMealType(mealType: string, dietType: string): string[] {
        const commonFoods: Record<string, string[]> = {
            'Café da manhã': [
                'Ovos', 'Aveia', 'Pão integral', 'Iogurte', 'Frutas',
                'Queijo cottage', 'Mel', 'Café', 'Leite', 'Granola'
            ],
            'Lanche da manhã': [
                'Frutas', 'Iogurte', 'Castanhas', 'Smoothie', 'Barra de proteína',
                'Queijo', 'Ovo cozido', 'Amendoim', 'Maçã com pasta de amendoim'
            ],
            'Almoço': [
                'Arroz integral', 'Feijão', 'Frango', 'Peixe', 'Carne bovina',
                'Salada verde', 'Legumes', 'Batata doce', 'Quinoa', 'Azeite'
            ],
            'Lanche da tarde': [
                'Frutas', 'Torrada integral', 'Pasta de amendoim', 'Whey protein',
                'Iogurte', 'Castanhas', 'Tapioca', 'Queijo branco', 'Omelete'
            ],
            'Jantar': [
                'Frango', 'Peixe', 'Ovo', 'Legumes', 'Salada', 'Batata doce',
                'Arroz integral', 'Abobrinha', 'Tofu', 'Macarrão integral'
            ],
            'Ceia': [
                'Iogurte', 'Chá de camomila', 'Mingau de aveia', 'Caseína',
                'Queijo cottage', 'Amêndoas', 'Banana', 'Leite morno'
            ]
        };

        // Adicionar ou remover alimentos com base no tipo de dieta
        if (dietType === 'low-carb') {
            return (commonFoods[mealType] || [])
                .filter(food => !['Arroz', 'Pão', 'Aveia', 'Granola', 'Batata', 'Macarrão', 'Tapioca'].some(carb => food.includes(carb)))
                .concat(['Abacate', 'Coco', 'Ovos mexidos', 'Queijos', 'Oleaginosas']);
        } else if (dietType === 'vegetarian') {
            return (commonFoods[mealType] || [])
                .filter(food => !['Frango', 'Peixe', 'Carne'].some(meat => food.includes(meat)))
                .concat(['Tofu', 'Tempeh', 'Lentilha', 'Grão-de-bico', 'Proteína de ervilha']);
        } else if (dietType === 'vegan') {
            return (commonFoods[mealType] || [])
                .filter(food => !['Frango', 'Peixe', 'Carne', 'Ovos', 'Leite', 'Queijo', 'Iogurte', 'Whey', 'Caseína'].some(animal => food.includes(animal)))
                .concat(['Tofu', 'Tempeh', 'Lentilha', 'Grão-de-bico', 'Proteína de ervilha', 'Leite vegetal', 'Iogurte de coco']);
        }

        return commonFoods[mealType] || ['Alimentos variados e equilibrados'];
    }

    /**
     * Retorna diretrizes específicas para um tipo de dieta
     */
    private getDietTypeGuidelines(dietType: string): string {
        const guidelines: Record<string, string> = {
            'balanced': '- Mantenha um equilíbrio entre proteínas, carboidratos e gorduras\n- Priorize carboidratos complexos e de baixo índice glicêmico\n- Inclua proteínas magras e gorduras saudáveis',
            'low-carb': '- Mantenha os carboidratos abaixo de 25% do total calórico\n- Priorize gorduras saudáveis como fonte energética\n- Evite grãos, açúcares e amidos\n- Aumente a ingestão de vegetais não-amiláceos',
            'high-protein': '- Garanta que cada refeição tenha pelo menos 25-30g de proteína\n- Distribua proteínas uniformemente ao longo do dia\n- Priorize proteínas de alto valor biológico\n- Limite gorduras saturadas',
            'vegetarian': '- Combine diferentes fontes vegetais de proteína para perfil completo de aminoácidos\n- Inclua fontes de ferro não-heme, zinco e vitamina B12\n- Utilize ovos e laticínios para complementar aminoácidos essenciais',
            'vegan': '- Combine diferentes fontes vegetais de proteína em cada refeição\n- Inclua alimentos fortificados com B12 ou considere suplementação\n- Priorize fontes de ômega-3 vegetal como linhaça e chia\n- Inclua alimentos ricos em ferro, zinco e cálcio',
            'mediterranean': '- Priorize azeite de oliva extra-virgem como fonte principal de gordura\n- Inclua peixes e frutos do mar regularmente\n- Utilize ervas e especiarias em vez de sal\n- Base as refeições em vegetais, legumes e grãos integrais'
        };

        return guidelines[dietType] || guidelines['balanced'];
    }

    /**
     * Retorna recomendações de micronutrientes importantes para o tipo de refeição
     */
    private getMicronutrientGuidelines(mealType: string): string {
        const guidelines: Record<string, string> = {
            'Café da manhã': '- Vitaminas do complexo B: importantes para o metabolismo energético no início do dia\n- Vitamina C: para absorção de ferro e função imunológica\n- Cálcio e vitamina D: para saúde óssea\n- Fibras solúveis: para controle glicêmico e saciedade',
            'Lanche da manhã': '- Vitaminas antioxidantes (A, C, E): para combater radicais livres\n- Magnésio: para função muscular e nervosa\n- Proteínas de digestão rápida: para manutenção muscular',
            'Almoço': '- Ferro: para transporte de oxigênio e combate à fadiga\n- Zinco: para função imune e hormonal\n- Fibras insolúveis: para saúde digestiva\n- Potássio: para equilíbrio eletrolítico e pressão arterial',
            'Lanche da tarde': '- Magnésio e potássio: para recuperação muscular\n- Antioxidantes: para reduzir inflamação\n- Vitaminas do complexo B: para manter energia para o final do dia',
            'Jantar': '- Triptofano: aminoácido precursor da serotonina e melatonina\n- Magnésio: para relaxamento muscular e qualidade do sono\n- Zinco: para recuperação tecidual durante o sono\n- Vitaminas do complexo B: para metabolismo e recuperação',
            'Ceia': '- Triptofano e magnésio: para promover sono de qualidade\n- Cálcio: para recuperação muscular durante o sono\n- Proteínas de digestão lenta: para manutenção muscular durante o período noturno'
        };

        return guidelines[mealType] || '- Variedade de vitaminas e minerais para garantir nutrição equilibrada\n- Atenção à hidratação e eletrólitos\n- Combinação adequada de macro e micronutrientes';
    }
}