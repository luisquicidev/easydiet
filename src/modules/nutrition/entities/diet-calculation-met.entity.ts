import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DietCalculation } from './diet-calculation.entity';
import { MetReference } from './met-reference.entity';

@Entity('diet_calculation_mets')
export class DietCalculationMet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'calculation_id' })
    calculationId: string;

    @Column({ name: 'met_code' })
    metCode: string;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        name: 'metFactor'
    })
    metFactor: number;

    @Column({ name: 'frequencyPerWeek' })
    frequencyPerWeek: number;

    @Column({ name: 'duration_minutes' })
    durationMinutes: number;

    // Relacionamentos
    @ManyToOne(() => DietCalculation, calculation => calculation.mets)
    @JoinColumn({ name: 'calculation_id' })
    calculation: DietCalculation;

    @ManyToOne(() => MetReference)
    @JoinColumn({ name: 'met_code' })
    metReference: MetReference;
}