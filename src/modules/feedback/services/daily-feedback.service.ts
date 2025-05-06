import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyFeedbackSummary } from '../entities/daily-feedback-summary.entity';
import { MealFeedback } from '../entities/meal-feedback.entity';
import { CreateDailyFeedbackSummaryDto } from '../dto/daily-feedback-summary.dto';

@Injectable()
export class DailyFeedbackService {
  constructor(
    @InjectRepository(DailyFeedbackSummary)
    private dailyFeedbackSummaryRepository: Repository<DailyFeedbackSummary>,
    @InjectRepository(MealFeedback)
    private mealFeedbackRepository: Repository<MealFeedback>,
  ) {}

  async create(data: Partial<DailyFeedbackSummary>): Promise<DailyFeedbackSummary> {
    const feedback = this.dailyFeedbackSummaryRepository.create(data);
    return this.dailyFeedbackSummaryRepository.save(feedback);
  }

  async findAll(userId: string): Promise<DailyFeedbackSummary[]> {
    return this.dailyFeedbackSummaryRepository.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DailyFeedbackSummary> {
    const summary = await this.dailyFeedbackSummaryRepository.findOne({
      where: { id },
    });

    if (!summary) {
      throw new NotFoundException(`Daily feedback summary with ID ${id} not found`);
    }

    return summary;
  }

  async update(id: string, updateDailyFeedbackSummaryDto: CreateDailyFeedbackSummaryDto): Promise<DailyFeedbackSummary> {
    const summary = await this.findOne(id);
    Object.assign(summary, updateDailyFeedbackSummaryDto);
    return this.dailyFeedbackSummaryRepository.save(summary);
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DailyFeedbackSummary[]> {
    return this.dailyFeedbackSummaryRepository.find({
      where: {
        user_id: userId,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });
  }

  async generateDailySummary(userId: string, date: Date): Promise<DailyFeedbackSummary> {
    // Buscar todos os feedbacks de refeições do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const mealFeedbacks = await this.mealFeedbackRepository.find({
      where: {
        user_id: userId,
        date: Between(startOfDay, endOfDay),
      },
    });

    if (mealFeedbacks.length === 0) {
      throw new NotFoundException(`No meal feedbacks found for user ${userId} on ${date.toISOString()}`);
    }

    // Calcular métricas
    const totalMealsConsumed = mealFeedbacks.length;
    const totalModifications = mealFeedbacks.reduce(
      (sum, feedback) => sum + (feedback.modifications?.length || 0),
      0,
    );

    const averageSatisfaction =
      mealFeedbacks.reduce((sum, feedback) => sum + (feedback.satisfaction_rating || 0), 0) /
      mealFeedbacks.length;

    const averageEnergy =
      mealFeedbacks.reduce((sum, feedback) => sum + (feedback.energy_level || 0), 0) /
      mealFeedbacks.length;

    const averageHunger =
      mealFeedbacks.reduce((sum, feedback) => sum + (feedback.hunger_level || 0), 0) /
      mealFeedbacks.length;

    // Calcular humor dominante
    const moodCounts = mealFeedbacks.reduce<Record<string, number>>((acc, feedback) => {
      if (feedback.mood) {
        acc[feedback.mood] = (acc[feedback.mood] || 0) + 1;
      }
      return acc;
    }, {});

    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Calcular aderência geral
    const overallAdherence = (totalMealsConsumed / 5) * 100; // Assumindo 5 refeições por dia

    // Criar ou atualizar o resumo diário
    const summary = await this.dailyFeedbackSummaryRepository.findOne({
      where: {
        user_id: userId,
        date,
      },
    });

    const summaryData = {
      user_id: userId,
      date,
      overall_adherence: overallAdherence,
      average_satisfaction: averageSatisfaction,
      average_energy: averageEnergy,
      average_hunger: averageHunger,
      dominant_mood: dominantMood,
      total_meals_consumed: totalMealsConsumed,
      total_meals_planned: 5, // Assumindo 5 refeições por dia
      total_modifications: totalModifications,
    };

    if (summary) {
      Object.assign(summary, summaryData);
      return this.dailyFeedbackSummaryRepository.save(summary);
    }

    return this.create(summaryData);
  }
} 