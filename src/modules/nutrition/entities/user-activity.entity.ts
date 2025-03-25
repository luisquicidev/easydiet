import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MetReference } from './met-reference.entity';

@Entity('user_activities')
export class UserActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'met_code' })
    metCode: string;

    @Column({ name: 'frequencyPerWeek' })
    frequencyPerWeek: number;

    @Column({ name: 'durationMinutes' })
    durationMinutes: number;

    @Column({ default: true, name: 'isActive' })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.activities)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => MetReference, metReference => metReference.activities)
    @JoinColumn({ name: 'met_code' })
    metReference: MetReference;
}