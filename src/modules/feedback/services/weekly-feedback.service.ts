import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WeeklyFeedback } from '../entities/weekly-feedback.entity';

@Injectable()
export class WeeklyFeedbackService {
  constructor(
    @InjectRepository(WeeklyFeedback)
    private weeklyFeedbackRepository: Repository<WeeklyFeedback>,
  ) {}

  async create(data: Partial<WeeklyFeedback>): Promise<WeeklyFeedback> {
    const feedback = this.weeklyFeedbackRepository.create(data);
    return this.weeklyFeedbackRepository.save(feedback);
  }

  async findAll(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WeeklyFeedback[]> {
    const where: any = { user_id: userId };
    if (startDate && endDate) {
      where.week_start_date = Between(startDate, endDate);
    }

    return this.weeklyFeedbackRepository.find({
      where,
      order: { week_start_date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WeeklyFeedback> {
    const feedback = await this.weeklyFeedbackRepository.findOne({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Weekly feedback with ID ${id} not found`);
    }

    return feedback;
  }
} 