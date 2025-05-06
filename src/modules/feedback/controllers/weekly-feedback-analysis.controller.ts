import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WeeklyFeedbackAnalysisService } from '../services/weekly-feedback-analysis.service';
import { WeeklyFeedbackService } from '../services/weekly-feedback.service';
import { FeedbackAnalysisAgentService } from '../services/feedback-analysis-agent.service';
import { CreateWeeklyFeedbackAnalysisDto, UpdateAnalysisStatusDto, ImplementRecommendationDto } from '../dto/weekly-feedback-analysis.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { User } from '../../../shared/decorators/user.decorator';
import { UserProfile } from '../interfaces/feedback-analysis-types.interface';

@Controller('feedback/weekly/analysis')
@UseGuards(JwtAuthGuard)
export class WeeklyFeedbackAnalysisController {
  constructor(
    private readonly analysisService: WeeklyFeedbackAnalysisService,
    private readonly weeklyFeedbackService: WeeklyFeedbackService,
    private readonly analysisAgent: FeedbackAnalysisAgentService,
  ) {}

  @Post(':id/analyze')
  async analyzeFeedback(
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    // Buscar dados necessários para análise
    const weeklyFeedback = await this.weeklyFeedbackService.findOne(id);
    
    // TODO: Buscar dados do usuário e histórico
    const userProfile = {} as UserProfile; // TODO: Implementar
    const historicalData = {
      measurements: [], // TODO: Implementar
      goals: [], // TODO: Implementar
      previousRecommendations: [], // TODO: Implementar
    };

    // Gerar análise usando o agente
    const analysisResult = await this.analysisAgent.analyzeFeedback({
      weeklyFeedback,
      userProfile,
      historicalData,
    });

    // Criar registro da análise
    const analysis = await this.analysisService.create({
      weekly_feedback_id: id,
      user_id: userId,
      recommendation_type: analysisResult.recommendationType,
      analysis_summary: analysisResult.analysisSummary,
      key_insights: analysisResult.keyInsights,
      recommended_changes: analysisResult.recommendedChanges,
      confidence_score: analysisResult.confidenceScore,
    });

    return analysis;
  }

  @Get()
  async findAll(
    @User('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analysisService.findAll(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.analysisService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnalysisStatusDto,
  ) {
    return this.analysisService.updateStatus(id, updateDto);
  }

  @Get('history')
  async getHistory(
    @User('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analysisService.getHistory(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post(':id/implement')
  async implementRecommendation(
    @Param('id') id: string,
    @Body() implementDto: ImplementRecommendationDto,
  ) {
    return this.analysisService.implementRecommendation(id, implementDto);
  }
} 