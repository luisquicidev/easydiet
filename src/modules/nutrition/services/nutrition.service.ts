import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetReference } from '../entities/met-reference.entity';
import { UserBiometrics } from '../entities/user-biometrics.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { UserMetCalculation } from '../entities/user-met-calculation.entity';
import { UserNutritionGoal } from '../entities/user-nutrition-goal.entity';
import { UserFoodPreference, FoodPreferenceType } from '../entities/user-food-preference.entity';
import {CreateFoodPreferenceDto} from "../dto/create-food-preference.dto";

@Injectable()
export class NutritionService {
    constructor(
        @InjectRepository(MetReference)
        private metReferenceRepository: Repository<MetReference>,

        @InjectRepository(UserBiometrics)
        private biometricsRepository: Repository<UserBiometrics>,

        @InjectRepository(UserActivity)
        private activityRepository: Repository<UserActivity>,

        @InjectRepository(UserMetCalculation)
        private metCalculationRepository: Repository<UserMetCalculation>,

        @InjectRepository(UserNutritionGoal)
        private nutritionGoalRepository: Repository<UserNutritionGoal>,

        @InjectRepository(UserFoodPreference)
        private foodPreferenceRepository: Repository<UserFoodPreference>,
    ) {}

    // Métodos para UserBiometrics
    async getUserBiometrics(userId: number): Promise<UserBiometrics> {
        const biometrics = await this.biometricsRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' }
        });

        if (!biometrics) {
            throw new NotFoundException(`User biometrics for user ${userId} not found`);
        }

        return biometrics;
    }

    async createUserBiometrics(userId: number, biometricsData: Partial<UserBiometrics>): Promise<UserBiometrics> {
        const biometrics = this.biometricsRepository.create({
            userId,
            ...biometricsData
        });
        return this.biometricsRepository.save(biometrics);
    }

    // Métodos para UserActivity
    async getUserActivities(userId: number): Promise<UserActivity[]> {
        return this.activityRepository.find({
            where: { userId, isActive: true },
            relations: ['metReference']
        });
    }

    async addUserActivity(userId: number, activityData: Partial<UserActivity>): Promise<UserActivity> {
        const activity = this.activityRepository.create({
            userId,
            ...activityData
        });
        return this.activityRepository.save(activity);
    }

    // Métodos para MetCalculation
    async saveMetCalculation(metCalculationData: Partial<UserMetCalculation>): Promise<UserMetCalculation> {
        // Marcar todos os cálculos anteriores como não atuais
        if (metCalculationData.userId) {
            await this.metCalculationRepository.update(
                { userId: metCalculationData.userId, isCurrent: true },
                { isCurrent: false }
            );
        }

        const metCalculation = this.metCalculationRepository.create(metCalculationData);
        return this.metCalculationRepository.save(metCalculation);
    }

    // Métodos para UserNutritionGoal
    async getUserNutritionGoal(userId: number): Promise<UserNutritionGoal> {
        const nutritionGoal = await this.nutritionGoalRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' }
        });

        if (!nutritionGoal) {
            throw new NotFoundException(`Nutrition goal for user ${userId} not found`);
        }

        return nutritionGoal;
    }

    async saveUserNutritionGoal(nutritionGoalData: Partial<UserNutritionGoal>): Promise<UserNutritionGoal> {
        const nutritionGoal = this.nutritionGoalRepository.create(nutritionGoalData);
        return this.nutritionGoalRepository.save(nutritionGoal);
    }

    // Métodos para UserFoodPreference
    async getUserFoodPreferences(userId: number): Promise<UserFoodPreference[]> {
        return this.foodPreferenceRepository.find({ where: { userId } });
    }

    async addUserFoodPreference(
        userId: number,
        type: FoodPreferenceType,
        description: string
    ): Promise<UserFoodPreference> {
        const preference = this.foodPreferenceRepository.create({
            userId,
            type,
            description
        });
        return this.foodPreferenceRepository.save(preference);
    }

    async addUserFoodPreferenceWithNutrition(
        userId: number,
        foodPreferenceDto: CreateFoodPreferenceDto
    ): Promise<UserFoodPreference> {
        const preference = this.foodPreferenceRepository.create({
            userId,
            ...foodPreferenceDto
        });
        return this.foodPreferenceRepository.save(preference);
    }

    async addExternalFoodPreference(
        userId: number,
        type: FoodPreferenceType,
        externalId: number,
        description: string,
        nutritionData: {
            calories?: number;
            carbohydrates?: number;
            proteins?: number;
            fats?: number;
            source?: string;
        }
    ): Promise<UserFoodPreference> {
        const preference = this.foodPreferenceRepository.create({
            userId,
            type,
            description,
            externalId,
            ...nutritionData
        });
        return this.foodPreferenceRepository.save(preference);
    }

    // Método para remover uma preferência alimentar
    async removeFoodPreference(userId: number, preferenceId: string): Promise<void> {
        const preference = await this.foodPreferenceRepository.findOne({
            where: { id: preferenceId, userId }
        });

        if (!preference) {
            throw new NotFoundException(`Preferência alimentar com ID "${preferenceId}" não encontrada`);
        }

        await this.foodPreferenceRepository.remove(preference);
    }

    // Método para atualizar uma preferência alimentar
    async updateFoodPreference(
        userId: number,
        preferenceId: string,
        updateData: Partial<CreateFoodPreferenceDto>
    ): Promise<UserFoodPreference> {
        const preference = await this.foodPreferenceRepository.findOne({
            where: { id: preferenceId, userId }
        });

        if (!preference) {
            throw new NotFoundException(`Preferência alimentar com ID "${preferenceId}" não encontrada`);
        }

        // Atualizar os campos
        Object.assign(preference, updateData);

        return this.foodPreferenceRepository.save(preference);
    }
}