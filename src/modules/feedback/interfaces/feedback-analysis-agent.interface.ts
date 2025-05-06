import { RecommendationType } from '../entities/weekly-feedback-analysis.entity';
import { FeedbackAnalysisInput } from './feedback-analysis-types.interface';

export interface RequiredAction {
  endpoint: string;
  method: string;
  data: Record<string, any>;
  priority: number;
}

export interface RecommendedChanges {
  diet_changes: {
    caloric_adjustment: number;
    macro_adjustments: {
      protein: number;
      carbs: number;
      fats: number;
    };
    meal_timing: string[];
    food_recommendations: string[];
  };
  workout_changes: {
    intensity_adjustment: string;
    frequency_adjustment: string;
    exercise_recommendations: string[];
  };
  lifestyle_changes: string[];
}

export interface AnalysisResult {
  recommendationType: RecommendationType;
  analysisSummary: string;
  keyInsights: string[];
  recommendedChanges: RecommendedChanges;
  confidenceScore: number;
  requiredActions: RequiredAction[];
}

export interface FeedbackAnalysisAgent {
  analyzeFeedback(data: FeedbackAnalysisInput): Promise<AnalysisResult>;
} 