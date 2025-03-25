import {Controller, Get, Post, Body, Param, UseGuards, Request, Put} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NutritionService } from '../services/nutrition.service';
import { DietService } from '../services/diet.service';
import { UserBiometrics } from '../entities/user-biometrics.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { UserNutritionGoal } from '../entities/user-nutrition-goal.entity';
import { FoodPreferenceType } from '../entities/user-food-preference.entity';
import {CreateFoodPreferenceDto} from "../dto/create-food-preference.dto";

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
    constructor(
        private readonly nutritionService: NutritionService,
        private readonly dietService: DietService,
    ) {}

    // Rotas para dados biométricos
    @Get('biometrics')
    async getUserBiometrics(@Request() req) {
        return this.nutritionService.getUserBiometrics(req.user.userId);
    }

    @Post('biometrics')
    async createBiometrics(@Request() req, @Body() biometricsData: Partial<UserBiometrics>) {
        return this.nutritionService.createUserBiometrics(req.user.userId, biometricsData);
    }

    // Rotas para atividades físicas
    @Get('activities')
    async getUserActivities(@Request() req) {
        return this.nutritionService.getUserActivities(req.user.userId);
    }

    @Post('activities')
    async addActivity(@Request() req, @Body() activityData: Partial<UserActivity>) {
        return this.nutritionService.addUserActivity(req.user.userId, activityData);
    }

    // Rotas para objetivos nutricionais
    @Get('goals')
    async getNutritionGoal(@Request() req) {
        return this.nutritionService.getUserNutritionGoal(req.user.userId);
    }

    @Post('goals')
    async setNutritionGoal(@Request() req, @Body() goalData: Partial<UserNutritionGoal>) {
        return this.nutritionService.saveUserNutritionGoal({
            userId: req.user.userId,
            ...goalData
        });
    }

    // Rotas para preferências alimentares
    @Get('preferences')
    async getFoodPreferences(@Request() req) {
        return this.nutritionService.getUserFoodPreferences(req.user.userId);
    }

    // Método original simplificado para compatibilidade com versões anteriores
    @Post('preferences/simple')
    async addSimpleFoodPreference(
        @Request() req,
        @Body() data: { type: FoodPreferenceType, description: string }
    ) {
        return this.nutritionService.addUserFoodPreference(
            req.user.userId,
            data.type,
            data.description
        );
    }

    // Novo endpoint para adicionar preferência com dados nutricionais
    @Post('preferences')
    async addFoodPreference(
        @Request() req,
        @Body() createFoodPreferenceDto: CreateFoodPreferenceDto
    ) {
        return this.nutritionService.addUserFoodPreferenceWithNutrition(
            req.user.userId,
            createFoodPreferenceDto
        );
    }

    // Endpoint para adicionar preferência com dados externos
    @Post('preferences/external')
    async addExternalFoodPreference(
        @Request() req,
        @Body() data: {
            type: FoodPreferenceType;
            externalId: number;
            description: string;
            calories?: number;
            carbohydrates?: number;
            proteins?: number;
            fats?: number;
            source?: string;
        }
    ) {
        const { type, externalId, description, ...nutritionData } = data;

        return this.nutritionService.addExternalFoodPreference(
            req.user.userId,
            type,
            externalId,
            description,
            nutritionData
        );
    }

    // Endpoint para atualizar uma preferência alimentar
    @Put('preferences/:id')
    async updateFoodPreference(
        @Request() req,
        @Param('id') id: string,
        @Body() updateData: Partial<CreateFoodPreferenceDto>
    ) {
        return this.nutritionService.updateFoodPreference(
            req.user.userId,
            id,
            updateData
        );
    }

    // Rotas para cálculo metabólico
    @Post('calculate')
    async calculateMetabolism(@Request() req) {
        // Criar um job de cálculo metabólico
        const biometrics = await this.nutritionService.getUserBiometrics(req.user.userId);
        const activities = await this.nutritionService.getUserActivities(req.user.userId);

        // Converter atividades para um formato amigável para o prompt
        const dailyActivity = activities.map(activity =>
            `${activity.metReference.description}: ${activity.durationMinutes} minutos, ${activity.frequencyPerWeek} vezes por semana`
        ).join('\n');

        // Criar o job de cálculo
        const job = await this.dietService.createDietJob(req.user.userId, 'metabolic_calculation', {
            biometrics,
            dailyActivity
        });

        // Em um ambiente de produção, esse processamento seria enviado para uma fila
        // Por enquanto, estamos chamando diretamente (mas seria assíncrono com Bull)
        // this.dietService.processMetabolicCalculationJob(job.id);

        return {
            message: 'Metabolic calculation job created',
            jobId: job.id
        };
    }

    // Rota para verificar o status de um job
    @Get('jobs/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        return this.dietService.getDietJob(jobId);
    }

    // Rota para buscar planos de dieta
    @Get('plans')
    async getUserDietPlans(@Request() req) {
        return this.dietService.getUserDietPlans(req.user.userId);
    }

    @Get('plans/:planId')
    async getDietPlan(@Param('planId') planId: string) {
        return this.dietService.getDietPlan(planId);
    }
}