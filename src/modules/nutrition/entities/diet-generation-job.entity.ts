import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DietPlan } from './diet-plan.entity';

export enum DietJobStatusEnum {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('diet_generation_jobs')
export class DietGenerationJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'jobType' })
    jobType: string;

    @Column({
        type: 'enum',
        enum: DietJobStatusEnum,
        default: DietJobStatusEnum.PENDING,
    })
    status: DietJobStatusEnum;

    @Column({ type: 'jsonb', nullable: true, name: 'inputData' })
    inputData: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true, name: 'resultData' })
    resultData: Record<string, any>;

    @Column({ type: 'text', nullable: true, name: 'errorLogs' })
    errorLogs: string;

    @Column({ default: 0 })
    progress: number;

    @Column({ nullable: true, name: 'bullJobId' })
    bullJobId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, user => user.dietJobs)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => DietPlan, dietPlan => dietPlan.job)
    dietPlans: DietPlan[];
}