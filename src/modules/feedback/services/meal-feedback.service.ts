import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealFeedback } from '../entities/meal-feedback.entity';
import { MealFeedbackFoods } from '../entities/meal-feedback-foods.entity';
import { MealFeedbackModifications } from '../entities/meal-feedback-modifications.entity';
import { CreateMealFeedbackDto } from '../dto/create-meal-feedback.dto';
import { UpdateMealFeedbackDto } from '../dto/update-meal-feedback.dto';
import { Between } from 'typeorm';

@Injectable()
export class MealFeedbackService {
  constructor(
    @InjectRepository(MealFeedback)
    private mealFeedbackRepository: Repository<MealFeedback>,
    @InjectRepository(MealFeedbackFoods)
    private mealFeedbackFoodsRepository: Repository<MealFeedbackFoods>,
    @InjectRepository(MealFeedbackModifications)
    private mealFeedbackModificationsRepository: Repository<MealFeedbackModifications>,
  ) {}

  async create(createMealFeedbackDto: CreateMealFeedbackDto): Promise<MealFeedback> {
    const { foods, modifications, ...feedbackData } = createMealFeedbackDto;

    // Criar o feedback principal
    const feedback = this.mealFeedbackRepository.create(feedbackData);
    await this.mealFeedbackRepository.save(feedback);

    // Criar os alimentos do feedback
    if (foods && foods.length > 0) {
      const feedbackFoods = foods.map(food => ({
        ...food,
        meal_feedback_id: feedback.id,
      }));
      await this.mealFeedbackFoodsRepository.save(feedbackFoods);
    }

    // Criar as modificações do feedback
    if (modifications && modifications.length > 0) {
      const feedbackModifications = modifications.map(mod => ({
        ...mod,
        meal_feedback_id: feedback.id,
      }));
      await this.mealFeedbackModificationsRepository.save(feedbackModifications);
    }

    return this.findOne(feedback.id);
  }

  async findAll(userId: string): Promise<MealFeedback[]> {
    return this.mealFeedbackRepository.find({
      where: { user_id: userId },
      relations: ['foods', 'modifications'],
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MealFeedback> {
    const feedback = await this.mealFeedbackRepository.findOne({
      where: { id },
      relations: ['foods', 'modifications'],
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return feedback;
  }

  async update(id: string, updateMealFeedbackDto: UpdateMealFeedbackDto): Promise<MealFeedback> {
    const { foods, modifications, ...feedbackData } = updateMealFeedbackDto;
    const feedback = await this.findOne(id);

    // Atualizar o feedback principal
    await this.mealFeedbackRepository.update(id, feedbackData);

    // Atualizar os alimentos
    if (foods) {
      // Remover alimentos existentes
      await this.mealFeedbackFoodsRepository.delete({ meal_feedback_id: id });
      // Inserir novos alimentos
      const feedbackFoods = foods.map(food => ({
        ...food,
        meal_feedback_id: id,
      }));
      await this.mealFeedbackFoodsRepository.save(feedbackFoods);
    }

    // Atualizar as modificações
    if (modifications) {
      // Remover modificações existentes
      await this.mealFeedbackModificationsRepository.delete({ meal_feedback_id: id });
      // Inserir novas modificações
      const feedbackModifications = modifications.map(mod => ({
        ...mod,
        meal_feedback_id: id,
      }));
      await this.mealFeedbackModificationsRepository.save(feedbackModifications);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const feedback = await this.findOne(id);
    await this.mealFeedbackRepository.remove(feedback);
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<MealFeedback[]> {
    return this.mealFeedbackRepository.find({
      where: {
        user_id: userId,
        date: Between(startDate, endDate),
      },
      relations: ['foods', 'modifications'],
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async findByMeal(userId: string, mealId: string): Promise<MealFeedback[]> {
    return this.mealFeedbackRepository.find({
      where: {
        user_id: userId,
        meal_id: mealId,
      },
      relations: ['foods', 'modifications'],
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }
} 