import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'measurement_type', length: 50 })
  measurement_type: string;

  @Column({ name: 'value', type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'unit', length: 20 })
  unit: string;

  @Column({ name: 'date', type: 'date' })
  date: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 