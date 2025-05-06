import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { Mood } from './meal-feedback.entity';

@Entity('daily_feedback_summary')
export class DailyFeedbackSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'float', nullable: true })
  overall_adherence: number;

  @Column({ type: 'float', nullable: true })
  energy_level: number;

  @Column({ type: 'float', nullable: true })
  sleep_quality: number;

  @Column({ type: 'float', nullable: true })
  stress_level: number;

  @Column({ type: 'jsonb', nullable: true })
  challenges: string[];

  @Column({ type: 'jsonb', nullable: true })
  achievements: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  user: User;
} 