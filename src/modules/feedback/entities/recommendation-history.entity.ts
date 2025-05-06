import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WeeklyFeedbackAnalysis, RecommendationType, RecommendationStatus } from './weekly-feedback-analysis.entity';

@Entity('recommendation_history')
export class RecommendationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  analysis_id: string;

  @Column({
    type: 'enum',
    enum: RecommendationType
  })
  recommendation_type: RecommendationType;

  @Column({
    type: 'enum',
    enum: RecommendationStatus,
    default: RecommendationStatus.PENDING
  })
  status: RecommendationStatus;

  @Column('timestamp', { nullable: true })
  implementation_date?: Date;

  @Column('text', { nullable: true })
  feedback_notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WeeklyFeedbackAnalysis)
  @JoinColumn({ name: 'analysis_id' })
  analysis: WeeklyFeedbackAnalysis;
} 