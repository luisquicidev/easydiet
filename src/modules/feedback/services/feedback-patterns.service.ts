import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FeedbackPatterns } from '../entities/feedback-patterns.entity';
import { MealFeedback } from '../entities/meal-feedback.entity';
import { CreateFeedbackPatternDto } from '../dto/feedback-pattern.dto';
import { UpdateFeedbackPatternDto } from '../dto/feedback-pattern.dto';

@Injectable()
export class FeedbackPatternsService {
  constructor(
    @InjectRepository(FeedbackPatterns)
    private feedbackPatternsRepository: Repository<FeedbackPatterns>,
    @InjectRepository(MealFeedback)
    private mealFeedbackRepository: Repository<MealFeedback>,
  ) {}

  async create(createFeedbackPatternDto: CreateFeedbackPatternDto): Promise<FeedbackPatterns> {
    const pattern = this.feedbackPatternsRepository.create(createFeedbackPatternDto);
    return this.feedbackPatternsRepository.save(pattern);
  }

  async findAll(userId: string): Promise<FeedbackPatterns[]> {
    return this.feedbackPatternsRepository.find({
      where: { user_id: userId },
      order: { last_updated: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FeedbackPatterns> {
    const pattern = await this.feedbackPatternsRepository.findOne({
      where: { id },
    });

    if (!pattern) {
      throw new NotFoundException(`Feedback pattern with ID ${id} not found`);
    }

    return pattern;
  }

  async update(id: string, updateFeedbackPatternDto: UpdateFeedbackPatternDto): Promise<FeedbackPatterns> {
    const pattern = await this.findOne(id);
    Object.assign(pattern, updateFeedbackPatternDto);
    return this.feedbackPatternsRepository.save(pattern);
  }

  async remove(id: string): Promise<void> {
    const pattern = await this.findOne(id);
    await this.feedbackPatternsRepository.remove(pattern);
  }

  async analyzePatterns(userId: string, days: number = 30): Promise<FeedbackPatterns[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar feedbacks do período
    const mealFeedbacks = await this.mealFeedbackRepository.find({
      where: {
        user_id: userId,
        date: Between(startDate, endDate),
      },
      relations: ['foods', 'modifications'],
    });

    if (mealFeedbacks.length === 0) {
      throw new NotFoundException(`No meal feedbacks found for user ${userId} in the last ${days} days`);
    }

    // Analisar padrões de modificação
    const modificationPatterns = this.analyzeModificationPatterns(mealFeedbacks);
    if (modificationPatterns) {
      await this.create({
        user_id: userId,
        pattern_type: 'modification_patterns',
        pattern_data: modificationPatterns,
        confidence_score: this.calculateConfidenceScore(modificationPatterns),
        is_active: true,
        last_updated: new Date()
      });
    }

    // Analisar padrões de satisfação
    const satisfactionPatterns = this.analyzeSatisfactionPatterns(mealFeedbacks);
    if (satisfactionPatterns) {
      await this.create({
        user_id: userId,
        pattern_type: 'satisfaction_patterns',
        pattern_data: satisfactionPatterns,
        confidence_score: this.calculateConfidenceScore(satisfactionPatterns),
        is_active: true,
        last_updated: new Date()
      });
    }

    // Analisar padrões de humor
    const moodPatterns = this.analyzeMoodPatterns(mealFeedbacks);
    if (moodPatterns) {
      await this.create({
        user_id: userId,
        pattern_type: 'mood_patterns',
        pattern_data: moodPatterns,
        confidence_score: this.calculateConfidenceScore(moodPatterns),
        is_active: true,
        last_updated: new Date()
      });
    }

    return this.findAll(userId);
  }

  private analyzeModificationPatterns(feedbacks: MealFeedback[]): Record<string, any> | null {
    const modifications = feedbacks.flatMap(f => f.modifications);
    if (modifications.length === 0) return null;

    const patterns = {
      most_modified_foods: this.getMostFrequentItems(modifications, 'original_food_id'),
      most_common_modifications: this.getMostFrequentItems(modifications, 'modification_type'),
      common_reasons: this.getMostFrequentItems(modifications, 'reason'),
    };

    return patterns;
  }

  private analyzeSatisfactionPatterns(feedbacks: MealFeedback[]): Record<string, any> | null {
    const ratedFeedbacks = feedbacks.filter(f => f.satisfaction_rating);
    if (ratedFeedbacks.length === 0) return null;

    const patterns = {
      average_satisfaction_by_meal: this.groupByAndAverage(ratedFeedbacks, 'meal_id', 'satisfaction_rating'),
      satisfaction_trend: this.calculateTrend(ratedFeedbacks, 'satisfaction_rating'),
    };

    return patterns;
  }

  private analyzeMoodPatterns(feedbacks: MealFeedback[]): Record<string, any> | null {
    const moodFeedbacks = feedbacks.filter(f => f.mood);
    if (moodFeedbacks.length === 0) return null;

    const patterns = {
      mood_distribution: this.getMostFrequentItems(moodFeedbacks, 'mood'),
      mood_by_meal: this.groupByAndCount(moodFeedbacks, 'meal_id', 'mood'),
    };

    return patterns;
  }

  private getMostFrequentItems(items: any[], field: string, limit: number = 5): Record<string, number> {
    const counts = items.reduce((acc: Record<string, number>, item: any) => {
      const value = item[field] as string;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .reduce((acc: Record<string, number>, [key, value]: [string, number]) => {
        acc[key] = value;
        return acc;
      }, {});
  }

  private groupByAndAverage(items: any[], groupField: string, valueField: string): Record<string, number> {
    const groups = items.reduce((acc: Record<string, number[]>, item: any) => {
      const group = item[groupField] as string;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item[valueField] as number);
      return acc;
    }, {});

    return Object.entries(groups).reduce((acc: Record<string, number>, [key, values]: [string, number[]]) => {
      acc[key] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      return acc;
    }, {});
  }

  private groupByAndCount(items: any[], groupField: string, valueField: string): Record<string, Record<string, number>> {
    return items.reduce((acc: Record<string, Record<string, number>>, item: any) => {
      const group = item[groupField];
      const value = item[valueField];
      if (!acc[group]) {
        acc[group] = {};
      }
      acc[group][value] = (acc[group][value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateTrend(items: any[], field: string): { slope: number; direction: string } | null {
    const values = items.map(item => item[field]);
    if (values.length < 2) return null;

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a: number, b: number) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = numerator / denominator;
    return {
      slope,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    };
  }

  private calculateConfidenceScore(pattern: Record<string, any>): number {
    // Implementar lógica de cálculo de confiança baseada na qualidade dos dados
    // Por enquanto, retorna um valor fixo
    return 0.8;
  }
} 