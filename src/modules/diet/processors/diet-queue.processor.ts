import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DietProcessorService, MetabolicCalculationData, MealPlanningData, FoodDetailingData } from '../services/diet-processor.service';

@Processor('diet-generation')
export class DietQueueProcessor {
    private readonly logger = new Logger(DietQueueProcessor.name);

    constructor(private readonly dietProcessorService: DietProcessorService) {}

    @Process('metabolic-calculation')
    async handleMetabolicCalculation(job: Job<MetabolicCalculationData>) {
        this.logger.debug(`Processing metabolic calculation job ${job.id}`);
        try {
            await this.dietProcessorService.processMetabolicCalculation(job);
            this.logger.debug(`Metabolic calculation job ${job.id} completed successfully`);
        } catch (error) {
            this.logger.error(`Error processing metabolic calculation job ${job.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    @Process('meal-planning')
    async handleMealPlanning(job: Job<MealPlanningData>) {
        this.logger.debug(`Processing meal planning job ${job.id}`);
        try {
            // Registrar progresso inicial
            await job.progress(10);

            const { userId, jobId, calculationId, mealsPerDay } = job.data;
            this.logger.log(`Processing meal planning for user ${userId}, calculation ${calculationId}`);

            // Chamar o serviço de processamento
            await this.dietProcessorService.processMealPlanning(job);

            this.logger.debug(`Meal planning job ${job.id} completed successfully`);
        } catch (error) {
            this.logger.error(`Error processing meal planning job ${job.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    @Process('food-detailing')
    async handleFoodDetailing(job: Job<FoodDetailingData>) {
        this.logger.debug(`Processing food detailing job ${job.id}`);
        try {
            await this.dietProcessorService.processFoodDetailing(job);
            this.logger.debug(`Food detailing job ${job.id} completed successfully`);
        } catch (error) {
            this.logger.error(`Error processing food detailing job ${job.id}: ${error.message}`, error.stack);
            throw error;
        }
    }
}