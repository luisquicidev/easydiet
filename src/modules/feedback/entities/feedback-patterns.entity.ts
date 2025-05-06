import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';

@Entity('feedback_patterns')
export class FeedbackPatterns {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'pattern_type', length: 50 })
  pattern_type: string;

  @Column({ name: 'pattern_data', type: 'jsonb' })
  pattern_data: Record<string, any>;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 3, scale: 2 })
  confidence_score: number;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'last_updated', type: 'timestamp' })
  last_updated: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 