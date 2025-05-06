import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WeeklyFeedback } from './weekly-feedback.entity';

export enum RecommendationType {
  MAINTAIN_PLAN = 'maintain_plan',
  MINOR_ADJUSTMENTS = 'minor_adjustments',
  SIGNIFICANT_CHANGES = 'significant_changes',
  COMPLETE_RESTRUCTURE = 'complete_restructure'
}

export enum RecommendationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented'
}

@Entity('weekly_feedback_analysis')
export class WeeklyFeedbackAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  weekly_feedback_id: string;

  @Column({
    type: 'enum',
    enum: RecommendationType,
    default: RecommendationType.MINOR_ADJUSTMENTS
  })
  recommendation_type: RecommendationType;

  @Column({
    type: 'enum',
    enum: RecommendationStatus,
    default: RecommendationStatus.PENDING
  })
  status: RecommendationStatus;

  @Column('text')
  analysis_summary: string;

  @Column('text', { array: true })
  key_insights: string[];

  @Column('jsonb')
  recommended_changes: {
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
  };

  @Column('float')
  confidence_score: number;

  @Column('text', { nullable: true })
  implementation_notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WeeklyFeedback)
  @JoinColumn({ name: 'weekly_feedback_id' })
  weekly_feedback: WeeklyFeedback;
} 