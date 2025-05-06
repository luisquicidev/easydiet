import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';

@Entity('weekly_feedback')
export class WeeklyFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ type: 'date' })
  week_start_date: Date;

  @Column({ type: 'float' })
  overall_adherence: number;

  @Column({ type: 'float' })
  goal_progress: number;

  @Column({ type: 'float' })
  energy_level: number;

  @Column({ type: 'float' })
  sleep_quality: number;

  @Column({ type: 'float' })
  stress_level: number;

  @Column({ type: 'jsonb' })
  challenges: string[];

  @Column({ type: 'jsonb' })
  achievements: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 