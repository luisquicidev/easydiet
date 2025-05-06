import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WeeklyFeedbackAnalysis } from '../entities/weekly-feedback-analysis.entity';
import { RecommendationHistory } from '../entities/recommendation-history.entity';
import { CreateWeeklyFeedbackAnalysisDto, UpdateAnalysisStatusDto, ImplementRecommendationDto } from '../dto/weekly-feedback-analysis.dto';
import { RecommendationType, RecommendationStatus } from '../entities/weekly-feedback-analysis.entity';

@Injectable()
export class WeeklyFeedbackAnalysisService {
  constructor(
    @InjectRepository(WeeklyFeedbackAnalysis)
    private analysisRepository: Repository<WeeklyFeedbackAnalysis>,
    @InjectRepository(RecommendationHistory)
    private historyRepository: Repository<RecommendationHistory>,
  ) {}

  async create(data: CreateWeeklyFeedbackAnalysisDto): Promise<WeeklyFeedbackAnalysis> {
    const analysis = this.analysisRepository.create(data);
    const savedAnalysis = await this.analysisRepository.save(analysis);

    // Criar histórico da recomendação
    const history = this.historyRepository.create({
      user_id: data.user_id,
      recommendation_type: data.recommendation_type,
      analysis_id: savedAnalysis.id,
      status: RecommendationStatus.PENDING,
    });
    await this.historyRepository.save(history);

    return savedAnalysis;
  }

  async findAll(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WeeklyFeedbackAnalysis[]> {
    const where: any = { user_id: userId };
    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    return this.analysisRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WeeklyFeedbackAnalysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }

    return analysis;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateAnalysisStatusDto,
  ): Promise<WeeklyFeedbackAnalysis> {
    const analysis = await this.findOne(id);
    Object.assign(analysis, updateDto);
    return this.analysisRepository.save(analysis);
  }

  async getHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RecommendationHistory[]> {
    const where: any = { user_id: userId };
    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    return this.historyRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async implementRecommendation(
    id: string,
    implementDto: ImplementRecommendationDto,
  ): Promise<WeeklyFeedbackAnalysis> {
    const analysis = await this.findOne(id);
    
    // Atualizar status da análise
    analysis.status = RecommendationStatus.IMPLEMENTED;
    analysis.implementation_notes = implementDto.implementation_notes;
    
    // Atualizar histórico
    await this.historyRepository.update(
      { analysis_id: id },
      {
        status: RecommendationStatus.IMPLEMENTED,
        implementation_date: new Date(),
        feedback_notes: implementDto.implementation_notes,
      },
    );

    return this.analysisRepository.save(analysis);
  }
} 