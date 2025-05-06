import { WeeklyFeedback } from '../entities/weekly-feedback.entity';
import { User } from '../../users/entities/user.entity';
import { Measurement } from '../entities/measurement.entity';
import { Goal } from '../entities/goal.entity';
import { WeeklyFeedbackAnalysis } from '../entities/weekly-feedback-analysis.entity';

export interface UserProfile extends User {
  dietaryPreferences: string[];
  workoutPreferences: string[];
  lifestylePreferences: string[];
  healthConditions: string[];
  allergies: string[];
  medications: string[];
}

export interface HistoricalData {
  measurements: Measurement[];
  goals: Goal[];
  previousRecommendations: WeeklyFeedbackAnalysis[];
}

export interface FeedbackAnalysisInput {
  weeklyFeedback: WeeklyFeedback;
  userProfile: UserProfile;
  historicalData: HistoricalData;
} 