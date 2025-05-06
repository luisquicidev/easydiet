import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GoalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export enum GoalType {
  WEIGHT = 'weight',
  BODY_FAT = 'body_fat',
  MUSCLE_MASS = 'muscle_mass',
  ENDURANCE = 'endurance',
  STRENGTH = 'strength',
  FLEXIBILITY = 'flexibility',
  NUTRITION = 'nutrition',
  LIFESTYLE = 'lifestyle'
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'goal_type', type: 'enum', enum: GoalType })
  goal_type: GoalType;

  @Column({ name: 'target_value', type: 'decimal', precision: 10, scale: 2 })
  target_value: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 10, scale: 2 })
  current_value: number;

  @Column({ name: 'unit', length: 20 })
  unit: string;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'target_date', type: 'date' })
  target_date: Date;

  @Column({ name: 'status', type: 'enum', enum: GoalStatus, default: GoalStatus.PENDING })
  status: GoalStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 