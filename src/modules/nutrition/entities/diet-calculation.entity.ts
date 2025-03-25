import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DietGenerationJob } from './diet-generation-job.entity';
import { DietCalculationFormula } from './diet-calculation-formula.entity';
import { DietCalculationMet } from './diet-calculation-met.entity';
import { DietPlan } from './diet-plan.entity';

@Entity('diet_calculations')
export class DietCalculation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: number;

    @Column()
    jobId: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    tmb: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    ger: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    activityLevel: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
    })
    objectivePct: number;

    @Column({
        default: 1,
    })
    statusPhase: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relacionamentos

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => DietGenerationJob)
    @JoinColumn({ name: 'job_id' })
    job: DietGenerationJob;

    @OneToMany(() => DietCalculationFormula, formula => formula.calculation)
    formulas: DietCalculationFormula[];

    @OneToMany(() => DietCalculationMet, met => met.calculation)
    mets: DietCalculationMet[];

    @OneToMany(() => DietPlan, plan => plan.calculation)
    plans: DietPlan[];
}