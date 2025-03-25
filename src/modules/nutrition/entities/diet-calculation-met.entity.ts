import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DietCalculation } from './diet-calculation.entity';
import { MetReference } from './met-reference.entity';

@Entity('diet_calculation_mets')
export class DietCalculationMet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    calculationId: string;

    @Column()
    metCode: string;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
    })
    metFactor: number;

    @Column()
    frequencyPerWeek: number;

    @Column()
    durationMinutes: number;

    // Relacionamentos

    @ManyToOne(() => DietCalculation, calculation => calculation.mets)
    @JoinColumn({ name: 'calculation_id' })
    calculation: DietCalculation;

    @ManyToOne(() => MetReference)
    @JoinColumn({ name: 'met_code' })
    metReference: MetReference;
}