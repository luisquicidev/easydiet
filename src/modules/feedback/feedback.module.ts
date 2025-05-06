import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FeedbackController } from './controllers/feedback.controller';
import { MealFeedbackService } from './services/meal-feedback.service';
import { DailyFeedbackService } from './services/daily-feedback.service';
import { FeedbackPatternsService } from './services/feedback-patterns.service';
import { MealFeedback } from './entities/meal-feedback.entity';
import { MealFeedbackFoods } from './entities/meal-feedback-foods.entity';
import { MealFeedbackModifications } from './entities/meal-feedback-modifications.entity';
import { DailyFeedbackSummary } from './entities/daily-feedback-summary.entity';
import { FeedbackPatterns } from './entities/feedback-patterns.entity';
import { WeeklyFeedbackAnalysis } from './entities/weekly-feedback-analysis.entity';
import { RecommendationHistory } from './entities/recommendation-history.entity';
import { WeeklyFeedbackAnalysisService } from './services/weekly-feedback-analysis.service';
import { WeeklyFeedbackAnalysisController } from './controllers/weekly-feedback-analysis.controller';
import { WeeklyFeedback } from './entities/weekly-feedback.entity';
import { WeeklyFeedbackController } from './controllers/weekly-feedback.controller';
import { WeeklyFeedbackService } from './services/weekly-feedback.service';
import { FeedbackAnalysisAgentService } from './services/feedback-analysis-agent.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MealFeedback,
      MealFeedbackFoods,
      MealFeedbackModifications,
      DailyFeedbackSummary,
      FeedbackPatterns,
      WeeklyFeedbackAnalysis,
      RecommendationHistory,
      WeeklyFeedback,
    ]),
    ConfigModule,
    SharedModule,
  ],
  controllers: [
    FeedbackController,
    WeeklyFeedbackController,
    WeeklyFeedbackAnalysisController,
  ],
  providers: [
    MealFeedbackService,
    DailyFeedbackService,
    FeedbackPatternsService,
    WeeklyFeedbackAnalysisService,
    WeeklyFeedbackService,
    FeedbackAnalysisAgentService,
  ],
  exports: [
    MealFeedbackService,
    DailyFeedbackService,
    FeedbackPatternsService,
    WeeklyFeedbackAnalysisService,
    WeeklyFeedbackService,
    FeedbackAnalysisAgentService,
  ],
})
export class FeedbackModule {} 